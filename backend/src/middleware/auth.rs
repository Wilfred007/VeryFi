use axum::{
    async_trait,
    extract::{FromRequestParts, State},
    http::{request::Parts, StatusCode},
    RequestPartsExt,
};
use axum_extra::{
    headers::{authorization::Bearer, Authorization},
    TypedHeader,
};

use crate::{
    errors::AppError,
    models::User,
    AppState,
};

pub struct AuthUser {
    pub user: User,
}

#[async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    AppState: FromRequestParts<S>,
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        // Extract the authorization header
        let TypedHeader(Authorization(bearer)) = parts
            .extract::<TypedHeader<Authorization<Bearer>>>()
            .await
            .map_err(|_| AppError::Unauthorized("Missing authorization header".to_string()))?;

        // Extract application state
        let State(app_state) = State::from_request_parts(parts, state)
            .await
            .map_err(|_| AppError::InternalServerError("Failed to extract app state".to_string()))?;

        // Verify the JWT token
        let claims = app_state.auth_service.verify_token(bearer.token())
            .map_err(|_| AppError::Unauthorized("Invalid token".to_string()))?;

        // Get user from database
        let user_id = uuid::Uuid::parse_str(&claims.sub)
            .map_err(|_| AppError::Unauthorized("Invalid user ID in token".to_string()))?;

        let user = app_state.auth_service.get_user_by_id(user_id)
            .await
            .map_err(|_| AppError::InternalServerError("Failed to fetch user".to_string()))?
            .ok_or_else(|| AppError::Unauthorized("User not found".to_string()))?;

        Ok(AuthUser { user })
    }
}

// Optional auth extractor that doesn't fail if no token is provided
pub struct OptionalAuthUser {
    pub user: Option<User>,
}

#[async_trait]
impl<S> FromRequestParts<S> for OptionalAuthUser
where
    AppState: FromRequestParts<S>,
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        match AuthUser::from_request_parts(parts, state).await {
            Ok(auth_user) => Ok(OptionalAuthUser {
                user: Some(auth_user.user),
            }),
            Err(_) => Ok(OptionalAuthUser { user: None }),
        }
    }
}
