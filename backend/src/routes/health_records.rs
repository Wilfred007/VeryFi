use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    routing::{get, post, put, delete},
    Json, Router,
};
use uuid::Uuid;
use validator::Validate;

use crate::{
    errors::{AppError, validation_error},
    models::{CreateHealthRecordRequest, HealthRecordResponse, HealthRecordQuery, UserRole},
    middleware::auth::AuthUser,
    services::HealthRecordService,
    AppState,
};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", post(create_health_record))
        .route("/", get(get_health_records))
        .route("/:id", get(get_health_record))
        .route("/:id", put(update_health_record))
        .route("/:id", delete(delete_health_record))
        .route("/:id/revoke", put(revoke_health_record))
        .route("/:id/sign", post(sign_health_record))
}

async fn create_health_record(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Json(request): Json<CreateHealthRecordRequest>,
) -> Result<(StatusCode, Json<HealthRecordResponse>), AppError> {
    // Validate request
    request.validate().map_err(validation_error)?;

    let health_record_service = HealthRecordService::new(
        state.auth_service.clone(),
        state.crypto_service.clone(),
    );

    let response = health_record_service
        .create_health_record(request, auth_user.user.id)
        .await?;

    Ok((StatusCode::CREATED, Json(response)))
}

async fn get_health_records(
    State(_state): State<AppState>,
    auth_user: AuthUser,
    Query(query): Query<HealthRecordQuery>,
) -> Result<Json<Vec<HealthRecordResponse>>, AppError> {
    let health_record_service = HealthRecordService::new(
        _state.auth_service.clone(),
        _state.crypto_service.clone(),
    );

    let records = health_record_service
        .get_user_health_records(auth_user.user.id, query)
        .await?;

    Ok(Json(records))
}

async fn get_health_record(
    State(_state): State<AppState>,
    auth_user: AuthUser,
    Path(record_id): Path<Uuid>,
) -> Result<Json<HealthRecordResponse>, AppError> {
    let health_record_service = HealthRecordService::new(
        _state.auth_service.clone(),
        _state.crypto_service.clone(),
    );

    let record = health_record_service
        .get_health_record_by_id(record_id, Some(auth_user.user.id))
        .await?;

    Ok(Json(record))
}

#[derive(serde::Deserialize, validator::Validate)]
struct UpdateHealthRecordRequest {
    pub details: Option<std::collections::HashMap<String, serde_json::Value>>,
    pub expiry_date: Option<chrono::NaiveDate>,
}

async fn update_health_record(
    State(_state): State<AppState>,
    auth_user: AuthUser,
    Path(record_id): Path<Uuid>,
    Json(request): Json<UpdateHealthRecordRequest>,
) -> Result<Json<HealthRecordResponse>, AppError> {
    // Validate request
    request.validate().map_err(validation_error)?;

    let health_record_service = HealthRecordService::new(
        _state.auth_service.clone(),
        _state.crypto_service.clone(),
    );

    let response = health_record_service
        .update_health_record(record_id, auth_user.user.id, request.details, request.expiry_date)
        .await?;

    Ok(Json(response))
}

async fn delete_health_record(
    State(_state): State<AppState>,
    auth_user: AuthUser,
    Path(record_id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    let health_record_service = HealthRecordService::new(
        _state.auth_service.clone(),
        _state.crypto_service.clone(),
    );

    health_record_service
        .delete_health_record(record_id, auth_user.user.id)
        .await?;

    Ok(StatusCode::NO_CONTENT)
}

async fn revoke_health_record(
    State(_state): State<AppState>,
    auth_user: AuthUser,
    Path(record_id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    // Only providers and admins can revoke health records
    if !matches!(auth_user.user.role, UserRole::Provider | UserRole::Admin) {
        return Err(AppError::Forbidden("Provider or admin access required".to_string()));
    }

    let health_record_service = HealthRecordService::new(
        _state.auth_service.clone(),
        _state.crypto_service.clone(),
    );

    health_record_service
        .revoke_health_record(record_id, auth_user.user.id)
        .await?;

    Ok(StatusCode::NO_CONTENT)
}

#[derive(serde::Deserialize, validator::Validate)]
struct SignHealthRecordRequest {
    #[validate(length(min = 1, message = "Private key is required"))]
    authority_private_key: String,
}

async fn sign_health_record(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Path(record_id): Path<Uuid>,
    Json(request): Json<SignHealthRecordRequest>,
) -> Result<Json<HealthRecordResponse>, AppError> {
    // Only providers and admins can sign health records
    if !matches!(auth_user.user.role, UserRole::Provider | UserRole::Admin) {
        return Err(AppError::Forbidden("Provider or admin access required".to_string()));
    }

    // Validate request
    request.validate().map_err(validation_error)?;

    let health_record_service = HealthRecordService::new(
        state.auth_service.clone(),
        state.crypto_service.clone(),
    );

    let response = health_record_service
        .sign_health_record(record_id, &request.authority_private_key, auth_user.user.id)
        .await?;

    Ok(Json(response))
}
