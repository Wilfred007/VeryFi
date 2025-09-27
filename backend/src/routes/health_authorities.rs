use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    routing::{get, post, put},
    Json, Router,
};
use uuid::Uuid;
use validator::Validate;

use crate::{
    errors::{AppError, validation_error},
    models::{CreateAuthorityRequest, UpdateAuthorityRequest, AuthorityResponse, AuthorityQuery, UserRole},
    middleware::auth::AuthUser,
    AppState,
};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", post(create_authority))
        .route("/", get(get_authorities))
        .route("/:id", get(get_authority))
        .route("/:id", put(update_authority))
}

async fn create_authority(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Json(request): Json<CreateAuthorityRequest>,
) -> Result<(StatusCode, Json<AuthorityResponse>), AppError> {
    // Only admins can create health authorities
    if !matches!(auth_user.user.role, UserRole::Admin) {
        return Err(AppError::Forbidden("Admin access required".to_string()));
    }

    // Validate request
    request.validate().map_err(validation_error)?;

    // Validate the public key format
    let _public_key = state.crypto_service.parse_public_key(&request.public_key)?;

    let db = &state.auth_service.db;

    let authority = sqlx::query_as::<_, crate::models::HealthAuthority>(
        r#"
        INSERT INTO health_authorities (name, authority_type, public_key, certificate)
        VALUES ($1, $2, $3, $4)
        RETURNING *
        "#
    )
    .bind(&request.name)
    .bind(&request.authority_type)
    .bind(&request.public_key)
    .bind(&request.certificate)
    .fetch_one(db)
    .await?;

    Ok((StatusCode::CREATED, Json(authority.into())))
}

async fn get_authorities(
    State(state): State<AppState>,
    Query(query): Query<AuthorityQuery>,
) -> Result<Json<Vec<AuthorityResponse>>, AppError> {
    let db = &state.auth_service.db;
    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(20).min(100);
    let offset = (page.saturating_sub(1)) * limit;

    let mut sql = String::from("SELECT * FROM health_authorities WHERE 1=1");
    let mut conditions = Vec::new();

    if let Some(authority_type) = &query.authority_type {
        conditions.push(format!("authority_type = '{:?}'", authority_type));
    }

    if let Some(is_active) = query.is_active {
        conditions.push(format!("is_active = {}", is_active));
    }

    if let Some(search) = &query.search {
        conditions.push(format!("name ILIKE '%{}%'", search.replace('\'', "''")));
    }

    if !conditions.is_empty() {
        sql.push_str(" AND ");
        sql.push_str(&conditions.join(" AND "));
    }

    sql.push_str(" ORDER BY created_at DESC");
    sql.push_str(&format!(" LIMIT {} OFFSET {}", limit, offset));

    let authorities = sqlx::query_as::<_, crate::models::HealthAuthority>(&sql)
        .fetch_all(db)
        .await?;

    let responses: Vec<AuthorityResponse> = authorities.into_iter().map(|a| a.into()).collect();

    Ok(Json(responses))
}

async fn get_authority(
    State(state): State<AppState>,
    Path(authority_id): Path<Uuid>,
) -> Result<Json<AuthorityResponse>, AppError> {
    let db = &state.auth_service.db;

    let authority = sqlx::query_as::<_, crate::models::HealthAuthority>(
        "SELECT * FROM health_authorities WHERE id = $1"
    )
    .bind(authority_id)
    .fetch_optional(db)
    .await?
    .ok_or_else(|| AppError::NotFound("Health authority not found".to_string()))?;

    Ok(Json(authority.into()))
}

async fn update_authority(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Path(authority_id): Path<Uuid>,
    Json(request): Json<UpdateAuthorityRequest>,
) -> Result<Json<AuthorityResponse>, AppError> {
    // Only admins can update health authorities
    if !matches!(auth_user.user.role, UserRole::Admin) {
        return Err(AppError::Forbidden("Admin access required".to_string()));
    }

    // Validate request
    request.validate().map_err(validation_error)?;

    let db = &state.auth_service.db;

    // Verify authority exists
    let existing_authority = sqlx::query!(
        "SELECT id FROM health_authorities WHERE id = $1",
        authority_id
    )
    .fetch_optional(db)
    .await?
    .ok_or_else(|| AppError::NotFound("Health authority not found".to_string()))?;

    // Update fields if provided
    if let Some(name) = &request.name {
        sqlx::query!(
            "UPDATE health_authorities SET name = $1, updated_at = NOW() WHERE id = $2",
            name,
            authority_id
        )
        .execute(db)
        .await?;
    }

    if let Some(authority_type) = &request.authority_type {
        sqlx::query!(
            "UPDATE health_authorities SET authority_type = $1, updated_at = NOW() WHERE id = $2",
            authority_type as &crate::models::AuthorityType,
            authority_id
        )
        .execute(db)
        .await?;
    }

    if let Some(public_key) = &request.public_key {
        // Validate the public key format
        let _validated_key = state.crypto_service.parse_public_key(public_key)?;
        
        sqlx::query!(
            "UPDATE health_authorities SET public_key = $1, updated_at = NOW() WHERE id = $2",
            public_key,
            authority_id
        )
        .execute(db)
        .await?;
    }

    if let Some(certificate) = &request.certificate {
        sqlx::query!(
            "UPDATE health_authorities SET certificate = $1, updated_at = NOW() WHERE id = $2",
            certificate,
            authority_id
        )
        .execute(db)
        .await?;
    }

    if let Some(is_active) = request.is_active {
        sqlx::query!(
            "UPDATE health_authorities SET is_active = $1, updated_at = NOW() WHERE id = $2",
            is_active,
            authority_id
        )
        .execute(db)
        .await?;
    }

    // Return updated authority
    let updated_authority = sqlx::query_as::<_, crate::models::HealthAuthority>(
        "SELECT * FROM health_authorities WHERE id = $1"
    )
    .bind(authority_id)
    .fetch_one(db)
    .await?;

    Ok(Json(updated_authority.into()))
}
