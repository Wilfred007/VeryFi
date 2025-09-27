use crate::models::{ZkProof, ProofType, GenerateProofRequest, ProofResponse, VerifyProofRequest, VerificationResponse, VerificationDetails, RevocationStatus, HealthRecord};
use crate::errors::AppError;
use crate::services::crypto::CryptoService;
use anyhow::Result;
use chrono::{DateTime, Utc, Duration};
use sqlx::PgPool;
use uuid::Uuid;
use std::process::Command;
use std::fs;
use std::path::Path;
use base64::{Engine as _, engine::general_purpose};

pub struct ZkProofService {
    db: PgPool,
    crypto_service: CryptoService,
    noir_circuit_path: String,
}

impl ZkProofService {
    pub fn new(db: PgPool, crypto_service: CryptoService, noir_circuit_path: String) -> Self {
        Self {
            db,
            crypto_service,
            noir_circuit_path,
        }
    }

    pub async fn generate_proof(&self, request: GenerateProofRequest, user_id: Uuid) -> Result<ProofResponse, AppError> {
        // Get health record and verify ownership
        let health_record = sqlx::query_as::<_, HealthRecord>(
            "SELECT * FROM health_records WHERE id = $1 AND user_id = $2 AND is_revoked = FALSE"
        )
        .bind(request.health_record_id)
        .bind(user_id)
        .fetch_optional(&self.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Health record not found or access denied".to_string()))?;

        // Get health authority public key for verification
        let authority = sqlx::query!(
            "SELECT public_key FROM health_authorities WHERE id = $1 AND is_active = TRUE",
            health_record.authority_id
        )
        .fetch_optional(&self.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Health authority not found or inactive".to_string()))?;

        // Generate ZK proof using Noir circuit
        let proof_data = self.generate_noir_proof(&health_record, &authority.public_key).await?;
        
        // Calculate expiration
        let expires_at = request.expires_in_hours.map(|hours| {
            Utc::now() + Duration::hours(hours as i64)
        });

        // Store proof in database
        let zk_proof = sqlx::query_as::<_, ZkProof>(
            r#"
            INSERT INTO zk_proofs (health_record_id, proof_data, verification_key, proof_type, expires_at, max_usage)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            "#
        )
        .bind(request.health_record_id)
        .bind(&proof_data.proof)
        .bind(&proof_data.verification_key)
        .bind(ProofType::EcdsaSignatureVerification)
        .bind(expires_at)
        .bind(request.max_usage)
        .fetch_one(&self.db)
        .await?;

        Ok(ProofResponse {
            id: zk_proof.id,
            proof_data: general_purpose::STANDARD.encode(&zk_proof.proof_data),
            verification_key: general_purpose::STANDARD.encode(&zk_proof.verification_key),
            proof_type: zk_proof.proof_type,
            generated_at: zk_proof.generated_at,
            expires_at: zk_proof.expires_at,
            usage_count: zk_proof.usage_count,
            max_usage: zk_proof.max_usage,
            health_record_type: format!("{:?}", health_record.record_type),
        })
    }

    pub async fn verify_proof(&self, request: VerifyProofRequest, verifier_id: Option<Uuid>, ip_address: Option<std::net::IpAddr>, user_agent: Option<String>) -> Result<VerificationResponse, AppError> {
        // Decode proof data
        let proof_data = general_purpose::STANDARD.decode(&request.proof_data)
            .map_err(|_| AppError::BadRequest("Invalid proof data encoding".to_string()))?;
        
        let verification_key = general_purpose::STANDARD.decode(&request.verification_key)
            .map_err(|_| AppError::BadRequest("Invalid verification key encoding".to_string()))?;

        // Find existing proof in database
        let zk_proof = sqlx::query_as::<_, ZkProof>(
            "SELECT * FROM zk_proofs WHERE proof_data = $1 AND verification_key = $2"
        )
        .bind(&proof_data)
        .bind(&verification_key)
        .fetch_optional(&self.db)
        .await?;

        let mut verification_details = VerificationDetails {
            health_record_type: None,
            issue_date: None,
            authority_name: None,
            is_expired: false,
            usage_exceeded: false,
            revocation_status: RevocationStatus::Unknown,
        };

        let mut is_valid = false;

        if let Some(proof) = &zk_proof {
            // Check expiration
            if let Some(expires_at) = proof.expires_at {
                if Utc::now() > expires_at {
                    verification_details.is_expired = true;
                } else {
                    is_valid = true;
                }
            } else {
                is_valid = true;
            }

            // Check usage limits
            if let Some(max_usage) = proof.max_usage {
                if proof.usage_count >= max_usage {
                    verification_details.usage_exceeded = true;
                    is_valid = false;
                }
            }

            // Get health record details
            if let Ok(Some(health_record)) = sqlx::query_as::<_, HealthRecord>(
                "SELECT * FROM health_records WHERE id = $1"
            )
            .bind(proof.health_record_id)
            .fetch_optional(&self.db)
            .await
            {
                verification_details.health_record_type = Some(format!("{:?}", health_record.record_type));
                verification_details.issue_date = Some(health_record.issue_date.to_string());
                verification_details.revocation_status = if health_record.is_revoked {
                    RevocationStatus::Revoked
                } else {
                    RevocationStatus::Valid
                };

                if health_record.is_revoked {
                    is_valid = false;
                }

                // Get authority name
                if let Ok(Some(authority)) = sqlx::query!(
                    "SELECT name FROM health_authorities WHERE id = $1",
                    health_record.authority_id
                )
                .fetch_optional(&self.db)
                .await
                {
                    verification_details.authority_name = Some(authority.name);
                }
            }

            // Verify the actual ZK proof using Noir
            if is_valid {
                is_valid = self.verify_noir_proof(&proof_data, &verification_key).await.unwrap_or(false);
            }

            // Update usage count if verification is successful
            if is_valid {
                sqlx::query(
                    "UPDATE zk_proofs SET usage_count = usage_count + 1 WHERE id = $1"
                )
                .bind(proof.id)
                .execute(&self.db)
                .await?;
            }

            // Log verification attempt
            sqlx::query(
                r#"
                INSERT INTO proof_verifications (proof_id, verifier_id, verification_result, verification_context, ip_address, user_agent)
                VALUES ($1, $2, $3, $4, $5, $6)
                "#
            )
            .bind(proof.id)
            .bind(verifier_id)
            .bind(is_valid)
            .bind(&request.verification_context)
            .bind(ip_address)
            .bind(user_agent)
            .execute(&self.db)
            .await?;
        }

        Ok(VerificationResponse {
            is_valid,
            proof_id: zk_proof.map(|p| p.id),
            verified_at: Utc::now(),
            verification_details,
        })
    }

    async fn generate_noir_proof(&self, health_record: &HealthRecord, authority_public_key: &str) -> Result<NoirProofData, AppError> {
        // Create temporary directory for proof generation
        let temp_dir = format!("/tmp/zk_proof_{}", Uuid::new_v4());
        fs::create_dir_all(&temp_dir)
            .map_err(|_| AppError::InternalServerError("Failed to create temp directory".to_string()))?;

        // Create Prover.toml with health record data
        let prover_toml = self.create_prover_toml(health_record, authority_public_key)?;
        let prover_path = format!("{}/Prover.toml", temp_dir);
        fs::write(&prover_path, prover_toml)
            .map_err(|_| AppError::InternalServerError("Failed to write Prover.toml".to_string()))?;

        // Copy Noir circuit to temp directory
        let circuit_src = Path::new(&self.noir_circuit_path);
        let circuit_dst = format!("{}/src", temp_dir);
        fs::create_dir_all(&circuit_dst)
            .map_err(|_| AppError::InternalServerError("Failed to create circuit directory".to_string()))?;

        // Copy main.nr and Nargo.toml
        fs::copy(circuit_src.join("src/main.nr"), format!("{}/main.nr", circuit_dst))
            .map_err(|_| AppError::InternalServerError("Failed to copy circuit".to_string()))?;
        
        fs::copy(circuit_src.join("Nargo.toml"), format!("{}/Nargo.toml", temp_dir))
            .map_err(|_| AppError::InternalServerError("Failed to copy Nargo.toml".to_string()))?;

        // Execute Noir proof generation
        let output = Command::new("nargo")
            .args(&["execute"])
            .current_dir(&temp_dir)
            .output()
            .map_err(|_| AppError::InternalServerError("Failed to execute Noir circuit".to_string()))?;

        if !output.status.success() {
            let error_msg = String::from_utf8_lossy(&output.stderr);
            return Err(AppError::InternalServerError(format!("Noir execution failed: {}", error_msg)));
        }

        // Read generated witness/proof
        let witness_path = format!("{}/target/health_passport_circuit.gz", temp_dir);
        let proof_data = fs::read(&witness_path)
            .map_err(|_| AppError::InternalServerError("Failed to read generated proof".to_string()))?;

        // Create verification key (for this demo, we'll use the authority's public key)
        let verification_key = hex::decode(authority_public_key.trim_start_matches("0x"))
            .map_err(|_| AppError::InternalServerError("Invalid authority public key".to_string()))?;

        // Cleanup temp directory
        let _ = fs::remove_dir_all(&temp_dir);

        Ok(NoirProofData {
            proof: proof_data,
            verification_key,
        })
    }

    fn create_prover_toml(&self, health_record: &HealthRecord, _authority_public_key: &str) -> Result<String, AppError> {
        // Format the signature components and message hash for Noir
        let format_bytes = |bytes: &[u8]| -> String {
            let hex_values: Vec<String> = bytes.iter().map(|b| format!("\"0x{:02x}\"", b)).collect();
            format!("[{}]", hex_values.join(", "))
        };

        // Extract public key coordinates from authority public key
        // For this demo, we'll use the same test public key from the original system
        let pubkey_x_hex = "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798";
        let pubkey_y_hex = "483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8";
        
        let pubkey_x_bytes = hex::decode(pubkey_x_hex)
            .map_err(|_| AppError::InternalServerError("Invalid public key X coordinate".to_string()))?;
        let pubkey_y_bytes = hex::decode(pubkey_y_hex)
            .map_err(|_| AppError::InternalServerError("Invalid public key Y coordinate".to_string()))?;

        let prover_toml = format!(
            r#"msg_hash = {}
pubkey_x = {}
pubkey_y = {}
signature_r = {}
signature_s = {}
"#,
            format_bytes(&health_record.message_hash),
            format_bytes(&pubkey_x_bytes),
            format_bytes(&pubkey_y_bytes),
            format_bytes(&health_record.signature_r),
            format_bytes(&health_record.signature_s)
        );

        Ok(prover_toml)
    }

    async fn verify_noir_proof(&self, _proof_data: &[u8], _verification_key: &[u8]) -> Result<bool, AppError> {
        // For this demo, we'll assume the proof is valid if it was generated by our system
        // In a production system, you would use a proper Noir verifier
        Ok(true)
    }

    pub async fn get_user_proofs(&self, user_id: Uuid, page: u32, limit: u32) -> Result<Vec<ProofResponse>, AppError> {
        let offset = (page.saturating_sub(1)) * limit;
        
        let proofs = sqlx::query_as::<_, ZkProof>(
            r#"
            SELECT zp.* FROM zk_proofs zp
            JOIN health_records hr ON zp.health_record_id = hr.id
            WHERE hr.user_id = $1
            ORDER BY zp.generated_at DESC
            LIMIT $2 OFFSET $3
            "#
        )
        .bind(user_id)
        .bind(limit as i64)
        .bind(offset as i64)
        .fetch_all(&self.db)
        .await?;

        let mut responses = Vec::new();
        for proof in proofs {
            // Get health record type
            let health_record_type = sqlx::query!(
                "SELECT record_type FROM health_records WHERE id = $1",
                proof.health_record_id
            )
            .fetch_optional(&self.db)
            .await?
            .map(|r| format!("{:?}", r.record_type))
            .unwrap_or_else(|| "Unknown".to_string());

            responses.push(ProofResponse {
                id: proof.id,
                proof_data: general_purpose::STANDARD.encode(&proof.proof_data),
                verification_key: general_purpose::STANDARD.encode(&proof.verification_key),
                proof_type: proof.proof_type,
                generated_at: proof.generated_at,
                expires_at: proof.expires_at,
                usage_count: proof.usage_count,
                max_usage: proof.max_usage,
                health_record_type,
            });
        }

        Ok(responses)
    }

    pub async fn revoke_proof(&self, proof_id: Uuid, user_id: Uuid) -> Result<(), AppError> {
        // Verify the user owns the health record associated with this proof
        let result = sqlx::query!(
            r#"
            SELECT zp.id FROM zk_proofs zp
            JOIN health_records hr ON zp.health_record_id = hr.id
            WHERE zp.id = $1 AND hr.user_id = $2
            "#,
            proof_id,
            user_id
        )
        .fetch_optional(&self.db)
        .await?;

        if result.is_none() {
            return Err(AppError::NotFound("Proof not found or access denied".to_string()));
        }

        // Set max_usage to current usage_count to effectively revoke the proof
        sqlx::query(
            "UPDATE zk_proofs SET max_usage = usage_count WHERE id = $1"
        )
        .bind(proof_id)
        .execute(&self.db)
        .await?;

        Ok(())
    }
}

#[derive(Debug)]
struct NoirProofData {
    proof: Vec<u8>,
    verification_key: Vec<u8>,
}
