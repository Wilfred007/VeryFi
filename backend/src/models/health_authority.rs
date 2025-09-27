use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct HealthAuthority {
    pub id: Uuid,
    pub name: String,
    pub authority_type: AuthorityType,
    pub public_key: String, // secp256k1 public key in hex format
    pub certificate: Option<String>, // X.509 certificate
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "varchar", rename_all = "snake_case")]
pub enum AuthorityType {
    Hospital,
    Clinic,
    Laboratory,
    Government,
    Pharmacy,
    University,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateAuthorityRequest {
    #[validate(length(min = 2, message = "Authority name must be at least 2 characters"))]
    pub name: String,
    pub authority_type: AuthorityType,
    #[validate(length(min = 1, message = "Public key is required"))]
    pub public_key: String,
    pub certificate: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateAuthorityRequest {
    pub name: Option<String>,
    pub authority_type: Option<AuthorityType>,
    pub public_key: Option<String>,
    pub certificate: Option<String>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Serialize)]
pub struct AuthorityResponse {
    pub id: Uuid,
    pub name: String,
    pub authority_type: AuthorityType,
    pub public_key: String,
    pub has_certificate: bool,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub health_records_count: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct AuthorityQuery {
    pub authority_type: Option<AuthorityType>,
    pub is_active: Option<bool>,
    pub search: Option<String>,
    pub page: Option<u32>,
    pub limit: Option<u32>,
}

impl From<HealthAuthority> for AuthorityResponse {
    fn from(authority: HealthAuthority) -> Self {
        Self {
            id: authority.id,
            name: authority.name,
            authority_type: authority.authority_type,
            public_key: authority.public_key,
            has_certificate: authority.certificate.is_some(),
            is_active: authority.is_active,
            created_at: authority.created_at,
            health_records_count: None,
        }
    }
}
