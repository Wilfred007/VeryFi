use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Authentication error: {0}")]
    Unauthorized(String),

    #[error("Access forbidden: {0}")]
    Forbidden(String),

    #[error("Resource not found: {0}")]
    NotFound(String),

    #[error("Conflict: {0}")]
    Conflict(String),

    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Internal server error: {0}")]
    InternalServerError(String),

    #[error("Service unavailable: {0}")]
    ServiceUnavailable(String),

    #[error("Rate limit exceeded")]
    RateLimitExceeded,

    #[error("Invalid proof: {0}")]
    InvalidProof(String),

    #[error("Cryptographic error: {0}")]
    CryptographicError(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message, error_code) = match self {
            AppError::Database(ref e) => {
                tracing::error!("Database error: {:?}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Internal server error".to_string(),
                    "DATABASE_ERROR",
                )
            }
            AppError::Validation(ref message) => (
                StatusCode::BAD_REQUEST,
                message.clone(),
                "VALIDATION_ERROR",
            ),
            AppError::Unauthorized(ref message) => (
                StatusCode::UNAUTHORIZED,
                message.clone(),
                "UNAUTHORIZED",
            ),
            AppError::Forbidden(ref message) => (
                StatusCode::FORBIDDEN,
                message.clone(),
                "FORBIDDEN",
            ),
            AppError::NotFound(ref message) => (
                StatusCode::NOT_FOUND,
                message.clone(),
                "NOT_FOUND",
            ),
            AppError::Conflict(ref message) => (
                StatusCode::CONFLICT,
                message.clone(),
                "CONFLICT",
            ),
            AppError::BadRequest(ref message) => (
                StatusCode::BAD_REQUEST,
                message.clone(),
                "BAD_REQUEST",
            ),
            AppError::InternalServerError(ref message) => {
                tracing::error!("Internal server error: {}", message);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Internal server error".to_string(),
                    "INTERNAL_SERVER_ERROR",
                )
            }
            AppError::ServiceUnavailable(ref message) => (
                StatusCode::SERVICE_UNAVAILABLE,
                message.clone(),
                "SERVICE_UNAVAILABLE",
            ),
            AppError::RateLimitExceeded => (
                StatusCode::TOO_MANY_REQUESTS,
                "Rate limit exceeded".to_string(),
                "RATE_LIMIT_EXCEEDED",
            ),
            AppError::InvalidProof(ref message) => (
                StatusCode::BAD_REQUEST,
                format!("Invalid proof: {}", message),
                "INVALID_PROOF",
            ),
            AppError::CryptographicError(ref message) => {
                tracing::error!("Cryptographic error: {}", message);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Cryptographic operation failed".to_string(),
                    "CRYPTOGRAPHIC_ERROR",
                )
            }
        };

        let body = Json(json!({
            "error": {
                "code": error_code,
                "message": error_message,
                "timestamp": chrono::Utc::now().to_rfc3339(),
            }
        }));

        (status, body).into_response()
    }
}

// Helper function to convert validation errors
pub fn validation_error(errors: validator::ValidationErrors) -> AppError {
    let error_messages: Vec<String> = errors
        .field_errors()
        .iter()
        .flat_map(|(field, errors)| {
            errors.iter().map(move |error| {
                format!(
                    "{}: {}",
                    field,
                    error.message.as_ref().unwrap_or(&"Invalid value".into())
                )
            })
        })
        .collect();

    AppError::Validation(error_messages.join(", "))
}
