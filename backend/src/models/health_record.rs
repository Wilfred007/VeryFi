use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc, NaiveDate};
use validator::Validate;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct HealthRecord {
    pub id: Uuid,
    pub user_id: Uuid,
    pub authority_id: Uuid,
    pub record_type: HealthRecordType,
    pub patient_identifier: String,
    pub details: serde_json::Value,
    pub issue_date: NaiveDate,
    pub expiry_date: Option<NaiveDate>,
    pub signature_r: Vec<u8>,
    pub signature_s: Vec<u8>,
    pub message_hash: Vec<u8>,
    pub is_revoked: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "varchar", rename_all = "snake_case")]
pub enum HealthRecordType {
    Vaccination,
    TestResult,
    MedicalClearance,
    ImmunityProof,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateHealthRecordRequest {
    pub authority_id: Uuid,
    pub record_type: HealthRecordType,
    #[validate(length(min = 1, message = "Patient identifier is required"))]
    pub patient_identifier: String,
    pub details: HashMap<String, serde_json::Value>,
    pub issue_date: NaiveDate,
    pub expiry_date: Option<NaiveDate>,
}

#[derive(Debug, Serialize)]
pub struct HealthRecordResponse {
    pub id: Uuid,
    pub record_type: HealthRecordType,
    pub patient_identifier: String,
    pub details: serde_json::Value,
    pub issue_date: NaiveDate,
    pub expiry_date: Option<NaiveDate>,
    pub authority_name: String,
    pub is_revoked: bool,
    pub created_at: DateTime<Utc>,
    pub has_valid_signature: bool,
}

#[derive(Debug, Deserialize)]
pub struct HealthRecordQuery {
    pub record_type: Option<HealthRecordType>,
    pub authority_id: Option<Uuid>,
    pub from_date: Option<NaiveDate>,
    pub to_date: Option<NaiveDate>,
    pub include_revoked: Option<bool>,
    pub page: Option<u32>,
    pub limit: Option<u32>,
}

// Specific health record detail structures
#[derive(Debug, Serialize, Deserialize)]
pub struct VaccinationDetails {
    pub vaccine_name: String,
    pub manufacturer: String,
    pub lot_number: String,
    pub dose_number: u32,
    pub total_doses: u32,
    pub vaccination_site: String,
    pub administrator: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TestResultDetails {
    pub test_type: String, // PCR, Antigen, Antibody
    pub result: String,    // Positive, Negative, Inconclusive
    pub test_method: String,
    pub laboratory: String,
    pub reference_range: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MedicalClearanceDetails {
    pub clearance_type: String, // Travel, Work, Sports
    pub restrictions: Vec<String>,
    pub valid_until: NaiveDate,
    pub physician: String,
    pub medical_facility: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImmunityProofDetails {
    pub immunity_type: String, // Natural, Vaccine-induced, Hybrid
    pub antibody_level: Option<f64>,
    pub test_method: String,
    pub laboratory: String,
    pub reference_range: String,
}
