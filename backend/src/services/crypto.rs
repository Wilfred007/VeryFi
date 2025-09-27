use crate::models::{HealthRecord, HealthRecordType};
use crate::errors::AppError;
use anyhow::Result;
use secp256k1::{Message, Secp256k1, SecretKey, PublicKey, ecdsa::Signature};
use sha2::{Digest, Sha256};
use hex;

pub struct CryptoService {
    secp: Secp256k1<secp256k1::All>,
}

impl CryptoService {
    pub fn new() -> Self {
        Self {
            secp: Secp256k1::new(),
        }
    }

    /// Generate ECDSA signature for a health record
    pub fn sign_health_record(
        &self,
        record_type: &HealthRecordType,
        patient_identifier: &str,
        details: &str,
        issue_date: &str,
        issuer: &str,
        private_key: &SecretKey,
    ) -> Result<HealthRecordSignature, AppError> {
        // Create the signable message in the same format as the original system
        let message_str = self.format_health_record_message(
            record_type,
            patient_identifier,
            details,
            issue_date,
            issuer,
        );

        // Convert message to bytes and pad to 32 bytes
        let mut message_bytes = [0u8; 32];
        let msg_bytes = message_str.as_bytes();
        let copy_len = std::cmp::min(msg_bytes.len(), 32);
        message_bytes[..copy_len].copy_from_slice(&msg_bytes[..copy_len]);

        // Compute SHA-256 hash
        let mut hasher = Sha256::new();
        hasher.update(&message_bytes);
        let msg_hash_bytes = hasher.finalize();
        let msg_hash_array: [u8; 32] = msg_hash_bytes.into();

        // Sign the message hash
        let message_obj = Message::from_digest_slice(&msg_hash_array)
            .map_err(|_| AppError::InternalServerError("Failed to create message from hash".to_string()))?;
        
        let mut signature = self.secp.sign_ecdsa(&message_obj, private_key);
        
        // Normalize signature for Noir compatibility
        signature.normalize_s();
        
        let signature_bytes = signature.serialize_compact();
        let signature_r = signature_bytes[0..32].to_vec();
        let signature_s = signature_bytes[32..64].to_vec();

        Ok(HealthRecordSignature {
            message_hash: msg_hash_array.to_vec(),
            signature_r,
            signature_s,
            original_message: message_str,
        })
    }

    /// Verify ECDSA signature for a health record
    pub fn verify_health_record_signature(
        &self,
        health_record: &HealthRecord,
        public_key: &PublicKey,
    ) -> Result<bool, AppError> {
        // Create message from hash
        let message_obj = Message::from_digest_slice(&health_record.message_hash)
            .map_err(|_| AppError::InternalServerError("Invalid message hash".to_string()))?;

        // Reconstruct signature
        let mut signature_bytes = [0u8; 64];
        signature_bytes[0..32].copy_from_slice(&health_record.signature_r);
        signature_bytes[32..64].copy_from_slice(&health_record.signature_s);

        let signature = Signature::from_compact(&signature_bytes)
            .map_err(|_| AppError::InternalServerError("Invalid signature format".to_string()))?;

        // Verify signature
        Ok(self.secp.verify_ecdsa(&message_obj, &signature, public_key).is_ok())
    }

    /// Parse public key from hex string
    pub fn parse_public_key(&self, public_key_hex: &str) -> Result<PublicKey, AppError> {
        let key_bytes = hex::decode(public_key_hex.trim_start_matches("0x"))
            .map_err(|_| AppError::BadRequest("Invalid public key hex format".to_string()))?;

        PublicKey::from_slice(&key_bytes)
            .map_err(|_| AppError::BadRequest("Invalid public key".to_string()))
    }

    /// Parse private key from hex string
    pub fn parse_private_key(&self, private_key_hex: &str) -> Result<SecretKey, AppError> {
        let key_bytes = hex::decode(private_key_hex.trim_start_matches("0x"))
            .map_err(|_| AppError::BadRequest("Invalid private key hex format".to_string()))?;

        SecretKey::from_slice(&key_bytes)
            .map_err(|_| AppError::BadRequest("Invalid private key".to_string()))
    }

    /// Generate a new key pair
    pub fn generate_key_pair(&self) -> (SecretKey, PublicKey) {
        let (secret_key, public_key) = self.secp.generate_keypair(&mut secp256k1::rand::thread_rng());
        (secret_key, public_key)
    }

    /// Format health record message for signing (matches the original format)
    fn format_health_record_message(
        &self,
        record_type: &HealthRecordType,
        patient_identifier: &str,
        details: &str,
        issue_date: &str,
        issuer: &str,
    ) -> String {
        let type_str = match record_type {
            HealthRecordType::Vaccination => "VaxRecord",
            HealthRecordType::TestResult => "TestResult",
            HealthRecordType::MedicalClearance => "MedClearance",
            HealthRecordType::ImmunityProof => "ImmunityProof",
        };

        format!("{}:{}_{}_{}:{}", type_str, patient_identifier, details, issue_date, issuer)
    }

    /// Extract public key coordinates for Noir circuit
    pub fn get_public_key_coordinates(&self, public_key: &PublicKey) -> Result<(Vec<u8>, Vec<u8>), AppError> {
        let public_key_bytes = public_key.serialize_uncompressed();
        
        // Skip the 0x04 prefix and extract coordinates
        if public_key_bytes.len() != 65 || public_key_bytes[0] != 0x04 {
            return Err(AppError::InternalServerError("Invalid uncompressed public key format".to_string()));
        }

        let pubkey_x = public_key_bytes[1..33].to_vec();
        let pubkey_y = public_key_bytes[33..65].to_vec();

        Ok((pubkey_x, pubkey_y))
    }

    /// Validate signature normalization (low-S requirement for Noir)
    pub fn is_signature_normalized(&self, signature_s: &[u8]) -> bool {
        signature_s.get(0).map_or(false, |&first_byte| first_byte < 0x80)
    }
}

#[derive(Debug)]
pub struct HealthRecordSignature {
    pub message_hash: Vec<u8>,
    pub signature_r: Vec<u8>,
    pub signature_s: Vec<u8>,
    pub original_message: String,
}

impl Default for CryptoService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::HealthRecordType;

    #[test]
    fn test_health_record_signing_and_verification() {
        let crypto_service = CryptoService::new();
        let (private_key, public_key) = crypto_service.generate_key_pair();

        let signature = crypto_service.sign_health_record(
            &HealthRecordType::Vaccination,
            "Patient123",
            "COVID19_Dose1",
            "2025",
            "HealthAuthority",
            &private_key,
        ).unwrap();

        // Create a mock health record
        let health_record = HealthRecord {
            id: uuid::Uuid::new_v4(),
            user_id: uuid::Uuid::new_v4(),
            authority_id: uuid::Uuid::new_v4(),
            record_type: HealthRecordType::Vaccination,
            patient_identifier: "Patient123".to_string(),
            details: serde_json::json!({}),
            issue_date: chrono::NaiveDate::from_ymd_opt(2025, 1, 1).unwrap(),
            expiry_date: None,
            signature_r: signature.signature_r,
            signature_s: signature.signature_s,
            message_hash: signature.message_hash,
            is_revoked: false,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        };

        let is_valid = crypto_service.verify_health_record_signature(&health_record, &public_key).unwrap();
        assert!(is_valid);
    }

    #[test]
    fn test_signature_normalization() {
        let crypto_service = CryptoService::new();
        
        // Test with a normalized signature (first byte < 0x80)
        let normalized_sig = vec![0x5d, 0x1b, 0x3d, 0xa0];
        assert!(crypto_service.is_signature_normalized(&normalized_sig));

        // Test with a non-normalized signature (first byte >= 0x80)
        let non_normalized_sig = vec![0x95, 0x1a, 0x71, 0xd9];
        assert!(!crypto_service.is_signature_normalized(&non_normalized_sig));
    }
}
