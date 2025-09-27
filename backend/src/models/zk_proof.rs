use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ZkProof {
    pub id: Uuid,
    pub health_record_id: Uuid,
    pub proof_data: Vec<u8>,
    pub verification_key: Vec<u8>,
    pub proof_type: ProofType,
    pub generated_at: DateTime<Utc>,
    pub expires_at: Option<DateTime<Utc>>,
    pub usage_count: i32,
    pub max_usage: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "varchar", rename_all = "snake_case")]
pub enum ProofType {
    EcdsaSignatureVerification,
}

#[derive(Debug, Deserialize, Validate)]
pub struct GenerateProofRequest {
    pub health_record_id: Uuid,
    pub expires_in_hours: Option<u32>, // Optional expiration
    pub max_usage: Option<i32>,        // Optional usage limit
    pub proof_context: Option<serde_json::Value>, // Additional context
}

#[derive(Debug, Serialize)]
pub struct ProofResponse {
    pub id: Uuid,
    pub proof_data: String, // Base64 encoded proof
    pub verification_key: String, // Base64 encoded verification key
    pub proof_type: ProofType,
    pub generated_at: DateTime<Utc>,
    pub expires_at: Option<DateTime<Utc>>,
    pub usage_count: i32,
    pub max_usage: Option<i32>,
    pub health_record_type: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct VerifyProofRequest {
    #[validate(length(min = 1, message = "Proof data is required"))]
    pub proof_data: String, // Base64 encoded proof
    #[validate(length(min = 1, message = "Verification key is required"))]
    pub verification_key: String, // Base64 encoded verification key
    pub proof_type: ProofType,
    pub verification_context: Option<serde_json::Value>,
}

#[derive(Debug, Serialize)]
pub struct VerificationResponse {
    pub is_valid: bool,
    pub proof_id: Option<Uuid>,
    pub verified_at: DateTime<Utc>,
    pub verification_details: VerificationDetails,
}

#[derive(Debug, Serialize)]
pub struct VerificationDetails {
    pub health_record_type: Option<String>,
    pub issue_date: Option<String>,
    pub authority_name: Option<String>,
    pub is_expired: bool,
    pub usage_exceeded: bool,
    pub revocation_status: RevocationStatus,
}

#[derive(Debug, Serialize)]
pub enum RevocationStatus {
    Valid,
    Revoked,
    Unknown,
}

#[derive(Debug, Serialize, FromRow)]
pub struct ProofVerification {
    pub id: Uuid,
    pub proof_id: Uuid,
    pub verifier_id: Option<Uuid>,
    pub verification_result: bool,
    pub verification_context: Option<serde_json::Value>,
    pub verified_at: DateTime<Utc>,
    pub ip_address: Option<std::net::IpAddr>,
    pub user_agent: Option<String>,
}
