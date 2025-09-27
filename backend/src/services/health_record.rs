use crate::models::{
    HealthRecord, HealthRecordResponse, CreateHealthRecordRequest, HealthRecordQuery,
    HealthRecordType, UserRole,
};
use crate::errors::AppError;
use crate::services::{AuthService, CryptoService};
use anyhow::Result;
use sqlx::PgPool;
use uuid::Uuid;
use std::sync::Arc;
use std::collections::HashMap;
use chrono::NaiveDate;

pub struct HealthRecordService {
    auth_service: Arc<AuthService>,
    crypto_service: Arc<CryptoService>,
}

impl HealthRecordService {
    pub fn new(auth_service: Arc<AuthService>, crypto_service: Arc<CryptoService>) -> Self {
        Self {
            auth_service,
            crypto_service,
        }
    }

    pub async fn create_health_record(
        &self,
        request: CreateHealthRecordRequest,
        user_id: Uuid,
    ) -> Result<HealthRecordResponse, AppError> {
        let db = &self.auth_service.db;

        // Verify the health authority exists and is active
        let authority = sqlx::query!(
            "SELECT name, public_key FROM health_authorities WHERE id = $1 AND is_active = TRUE",
            request.authority_id
        )
        .fetch_optional(db)
        .await?
        .ok_or_else(|| AppError::NotFound("Health authority not found or inactive".to_string()))?;

        // Create health record without signature initially
        let health_record = sqlx::query_as::<_, HealthRecord>(
            r#"
            INSERT INTO health_records (
                user_id, authority_id, record_type, patient_identifier, 
                details, issue_date, expiry_date, signature_r, signature_s, message_hash
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
            "#
        )
        .bind(user_id)
        .bind(request.authority_id)
        .bind(&request.record_type)
        .bind(&request.patient_identifier)
        .bind(serde_json::to_value(&request.details)?)
        .bind(request.issue_date)
        .bind(request.expiry_date)
        .bind(vec![0u8; 32]) // Placeholder signature_r
        .bind(vec![0u8; 32]) // Placeholder signature_s
        .bind(vec![0u8; 32]) // Placeholder message_hash
        .fetch_one(db)
        .await?;

        Ok(HealthRecordResponse {
            id: health_record.id,
            record_type: health_record.record_type,
            patient_identifier: health_record.patient_identifier,
            details: health_record.details,
            issue_date: health_record.issue_date,
            expiry_date: health_record.expiry_date,
            authority_name: authority.name,
            is_revoked: health_record.is_revoked,
            created_at: health_record.created_at,
            has_valid_signature: false, // Not signed yet
        })
    }

    pub async fn sign_health_record(
        &self,
        record_id: Uuid,
        authority_private_key: &str,
        _signer_user_id: Uuid,
    ) -> Result<HealthRecordResponse, AppError> {
        let db = &self.auth_service.db;

        // Get the health record
        let mut health_record = sqlx::query_as::<_, HealthRecord>(
            "SELECT * FROM health_records WHERE id = $1"
        )
        .bind(record_id)
        .fetch_optional(db)
        .await?
        .ok_or_else(|| AppError::NotFound("Health record not found".to_string()))?;

        // Get authority information
        let authority = sqlx::query!(
            "SELECT name, public_key FROM health_authorities WHERE id = $1",
            health_record.authority_id
        )
        .fetch_optional(db)
        .await?
        .ok_or_else(|| AppError::NotFound("Health authority not found".to_string()))?;

        // Parse the private key
        let private_key = self.crypto_service.parse_private_key(authority_private_key)?;

        // Extract details for signing
        let details_str = self.extract_details_for_signing(&health_record.details, &health_record.record_type)?;

        // Generate signature
        let signature = self.crypto_service.sign_health_record(
            &health_record.record_type,
            &health_record.patient_identifier,
            &details_str,
            &health_record.issue_date.to_string(),
            &authority.name,
            &private_key,
        )?;

        // Update the health record with the signature
        health_record = sqlx::query_as::<_, HealthRecord>(
            r#"
            UPDATE health_records 
            SET signature_r = $1, signature_s = $2, message_hash = $3, updated_at = NOW()
            WHERE id = $4
            RETURNING *
            "#
        )
        .bind(&signature.signature_r)
        .bind(&signature.signature_s)
        .bind(&signature.message_hash)
        .bind(record_id)
        .fetch_one(db)
        .await?;

        Ok(HealthRecordResponse {
            id: health_record.id,
            record_type: health_record.record_type,
            patient_identifier: health_record.patient_identifier,
            details: health_record.details,
            issue_date: health_record.issue_date,
            expiry_date: health_record.expiry_date,
            authority_name: authority.name,
            is_revoked: health_record.is_revoked,
            created_at: health_record.created_at,
            has_valid_signature: true,
        })
    }

    pub async fn get_user_health_records(
        &self,
        user_id: Uuid,
        query: HealthRecordQuery,
    ) -> Result<Vec<HealthRecordResponse>, AppError> {
        let db = &self.auth_service.db;
        let page = query.page.unwrap_or(1);
        let limit = query.limit.unwrap_or(20).min(100);
        let offset = (page.saturating_sub(1)) * limit;

        let mut sql = String::from(
            r#"
            SELECT hr.*, ha.name as authority_name
            FROM health_records hr
            JOIN health_authorities ha ON hr.authority_id = ha.id
            WHERE hr.user_id = $1
            "#
        );

        let mut param_count = 1;
        let mut params: Vec<Box<dyn sqlx::Encode<'_, sqlx::Postgres> + Send + Sync>> = vec![Box::new(user_id)];

        if let Some(record_type) = &query.record_type {
            param_count += 1;
            sql.push_str(&format!(" AND hr.record_type = ${}", param_count));
            params.push(Box::new(record_type.clone()));
        }

        if let Some(authority_id) = query.authority_id {
            param_count += 1;
            sql.push_str(&format!(" AND hr.authority_id = ${}", param_count));
            params.push(Box::new(authority_id));
        }

        if let Some(from_date) = query.from_date {
            param_count += 1;
            sql.push_str(&format!(" AND hr.issue_date >= ${}", param_count));
            params.push(Box::new(from_date));
        }

        if let Some(to_date) = query.to_date {
            param_count += 1;
            sql.push_str(&format!(" AND hr.issue_date <= ${}", param_count));
            params.push(Box::new(to_date));
        }

        if !query.include_revoked.unwrap_or(false) {
            sql.push_str(" AND hr.is_revoked = FALSE");
        }

        sql.push_str(" ORDER BY hr.created_at DESC");
        sql.push_str(&format!(" LIMIT ${} OFFSET ${}", param_count + 1, param_count + 2));
        params.push(Box::new(limit as i64));
        params.push(Box::new(offset as i64));

        // For simplicity, we'll use a basic query here
        // In a real implementation, you'd want to use a query builder or similar
        let records = sqlx::query!(
            r#"
            SELECT hr.*, ha.name as authority_name
            FROM health_records hr
            JOIN health_authorities ha ON hr.authority_id = ha.id
            WHERE hr.user_id = $1 AND hr.is_revoked = FALSE
            ORDER BY hr.created_at DESC
            LIMIT $2 OFFSET $3
            "#,
            user_id,
            limit as i64,
            offset as i64
        )
        .fetch_all(db)
        .await?;

        let mut responses = Vec::new();
        for record in records {
            responses.push(HealthRecordResponse {
                id: record.id,
                record_type: serde_json::from_value(serde_json::Value::String(record.record_type))?,
                patient_identifier: record.patient_identifier,
                details: record.details,
                issue_date: record.issue_date,
                expiry_date: record.expiry_date,
                authority_name: record.authority_name,
                is_revoked: record.is_revoked,
                created_at: record.created_at,
                has_valid_signature: !record.signature_r.is_empty() && !record.signature_s.is_empty(),
            });
        }

        Ok(responses)
    }

    pub async fn get_health_record_by_id(
        &self,
        record_id: Uuid,
        user_id: Option<Uuid>,
    ) -> Result<HealthRecordResponse, AppError> {
        let db = &self.auth_service.db;

        let mut sql = String::from(
            r#"
            SELECT hr.*, ha.name as authority_name
            FROM health_records hr
            JOIN health_authorities ha ON hr.authority_id = ha.id
            WHERE hr.id = $1
            "#
        );

        if let Some(uid) = user_id {
            sql.push_str(" AND hr.user_id = $2");
            let record = sqlx::query!(
                &sql,
                record_id,
                uid
            )
            .fetch_optional(db)
            .await?
            .ok_or_else(|| AppError::NotFound("Health record not found or access denied".to_string()))?;

            return Ok(HealthRecordResponse {
                id: record.id,
                record_type: serde_json::from_value(serde_json::Value::String(record.record_type))?,
                patient_identifier: record.patient_identifier,
                details: record.details,
                issue_date: record.issue_date,
                expiry_date: record.expiry_date,
                authority_name: record.authority_name,
                is_revoked: record.is_revoked,
                created_at: record.created_at,
                has_valid_signature: !record.signature_r.is_empty() && !record.signature_s.is_empty(),
            });
        }

        let record = sqlx::query!(
            r#"
            SELECT hr.*, ha.name as authority_name
            FROM health_records hr
            JOIN health_authorities ha ON hr.authority_id = ha.id
            WHERE hr.id = $1
            "#,
            record_id
        )
        .fetch_optional(db)
        .await?
        .ok_or_else(|| AppError::NotFound("Health record not found".to_string()))?;

        Ok(HealthRecordResponse {
            id: record.id,
            record_type: serde_json::from_value(serde_json::Value::String(record.record_type))?,
            patient_identifier: record.patient_identifier,
            details: record.details,
            issue_date: record.issue_date,
            expiry_date: record.expiry_date,
            authority_name: record.authority_name,
            is_revoked: record.is_revoked,
            created_at: record.created_at,
            has_valid_signature: !record.signature_r.is_empty() && !record.signature_s.is_empty(),
        })
    }

    pub async fn update_health_record(
        &self,
        record_id: Uuid,
        user_id: Uuid,
        details: Option<HashMap<String, serde_json::Value>>,
        expiry_date: Option<NaiveDate>,
    ) -> Result<HealthRecordResponse, AppError> {
        let db = &self.auth_service.db;

        // Verify ownership
        let existing_record = sqlx::query!(
            "SELECT id FROM health_records WHERE id = $1 AND user_id = $2",
            record_id,
            user_id
        )
        .fetch_optional(db)
        .await?
        .ok_or_else(|| AppError::NotFound("Health record not found or access denied".to_string()))?;

        // Update the record
        if let Some(new_details) = details {
            sqlx::query!(
                "UPDATE health_records SET details = $1, updated_at = NOW() WHERE id = $2",
                serde_json::to_value(&new_details)?,
                record_id
            )
            .execute(db)
            .await?;
        }

        if let Some(new_expiry) = expiry_date {
            sqlx::query!(
                "UPDATE health_records SET expiry_date = $1, updated_at = NOW() WHERE id = $2",
                new_expiry,
                record_id
            )
            .execute(db)
            .await?;
        }

        // Return updated record
        self.get_health_record_by_id(record_id, Some(user_id)).await
    }

    pub async fn delete_health_record(&self, record_id: Uuid, user_id: Uuid) -> Result<(), AppError> {
        let db = &self.auth_service.db;

        let result = sqlx::query!(
            "DELETE FROM health_records WHERE id = $1 AND user_id = $2",
            record_id,
            user_id
        )
        .execute(db)
        .await?;

        if result.rows_affected() == 0 {
            return Err(AppError::NotFound("Health record not found or access denied".to_string()));
        }

        Ok(())
    }

    pub async fn revoke_health_record(&self, record_id: Uuid, _revoker_user_id: Uuid) -> Result<(), AppError> {
        let db = &self.auth_service.db;

        let result = sqlx::query!(
            "UPDATE health_records SET is_revoked = TRUE, updated_at = NOW() WHERE id = $1",
            record_id
        )
        .execute(db)
        .await?;

        if result.rows_affected() == 0 {
            return Err(AppError::NotFound("Health record not found".to_string()));
        }

        Ok(())
    }

    fn extract_details_for_signing(
        &self,
        details: &serde_json::Value,
        record_type: &HealthRecordType,
    ) -> Result<String, AppError> {
        match record_type {
            HealthRecordType::Vaccination => {
                if let Some(vaccine_name) = details.get("vaccine_name").and_then(|v| v.as_str()) {
                    Ok(format!("{}_Dose1", vaccine_name))
                } else {
                    Ok("COVID19_Dose1".to_string())
                }
            }
            HealthRecordType::TestResult => {
                if let Some(result) = details.get("result").and_then(|v| v.as_str()) {
                    Ok(format!("COVID19_{}", result))
                } else {
                    Ok("COVID19_Negative".to_string())
                }
            }
            HealthRecordType::MedicalClearance => {
                if let Some(clearance_type) = details.get("clearance_type").and_then(|v| v.as_str()) {
                    Ok(clearance_type.to_string())
                } else {
                    Ok("FitForTravel".to_string())
                }
            }
            HealthRecordType::ImmunityProof => {
                if let Some(immunity_type) = details.get("immunity_type").and_then(|v| v.as_str()) {
                    Ok(format!("COVID19_{}", immunity_type))
                } else {
                    Ok("COVID19_Antibodies".to_string())
                }
            }
        }
    }
}
