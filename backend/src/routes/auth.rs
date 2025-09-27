use axum::{
    extract::State,
    http::StatusCode,
    routing::{post, get, put},
    Json, Router,
};
use validator::Validate;

use crate::{
    errors::{AppError, validation_error},
    models::{CreateUserRequest, LoginRequest, UserResponse},
    middleware::auth::AuthUser,
    AppState,
};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/register", post(register))
        .route("/login", post(login))
        .route("/me", get(get_current_user))
        .route("/change-password", put(change_password))
        .route("/verify", post(verify_user))
}

async fn register(
    State(state): State<AppState>,
    Json(request): Json<CreateUserRequest>,
) -> Result<(StatusCode, Json<UserResponse>), AppError> {
    // Validate request
    request.validate().map_err(validation_error)?;

    let user = state.auth_service.register_user(request).await?;

    Ok((StatusCode::CREATED, Json(user)))
}

async fn login(
    State(state): State<AppState>,
    Json(request): Json<LoginRequest>,
) -> Result<Json<crate::models::LoginResponse>, AppError> {
    // Validate request
    request.validate().map_err(validation_error)?;

    let response = state.auth_service.login(request).await?;

    Ok(Json(response))
}

async fn get_current_user(
    auth_user: AuthUser,
) -> Result<Json<UserResponse>, AppError> {
    Ok(Json(auth_user.user.into()))
}

#[derive(serde::Deserialize, validator::Validate)]
struct ChangePasswordRequest {
    #[validate(length(min = 8, message = "Current password is required"))]
    current_password: String,
    #[validate(length(min = 8, message = "New password must be at least 8 characters"))]
    new_password: String,
}

async fn change_password(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Json(request): Json<ChangePasswordRequest>,
) -> Result<StatusCode, AppError> {
    // Validate request
    request.validate().map_err(validation_error)?;

    state.auth_service.change_password(
        auth_user.user.id,
        &request.current_password,
        &request.new_password,
    ).await?;

    Ok(StatusCode::NO_CONTENT)
}

#[derive(serde::Deserialize)]
struct VerifyUserRequest {
    user_id: uuid::Uuid,
    is_verified: bool,
}

async fn verify_user(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Json(request): Json<VerifyUserRequest>,
) -> Result<StatusCode, AppError> {
    // Only admins can verify users
    if !matches!(auth_user.user.role, crate::models::UserRole::Admin) {
        return Err(AppError::Forbidden("Admin access required".to_string()));
    }

    state.auth_service.update_user_verification(request.user_id, request.is_verified).await?;

    Ok(StatusCode::NO_CONTENT)
}
