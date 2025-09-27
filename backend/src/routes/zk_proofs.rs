use axum::{
    extract::{Path, Query, State, ConnectInfo},
    http::{StatusCode, HeaderMap},
    routing::{get, post, put},
    Json, Router,
};
use uuid::Uuid;
use validator::Validate;
use std::net::SocketAddr;

use crate::{
    errors::{AppError, validation_error},
    models::{GenerateProofRequest, ProofResponse, VerifyProofRequest, VerificationResponse},
    middleware::auth::{AuthUser, OptionalAuthUser},
    AppState,
};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/generate", post(generate_proof))
        .route("/verify", post(verify_proof))
        .route("/", get(get_user_proofs))
        .route("/:id", get(get_proof))
        .route("/:id/revoke", put(revoke_proof))
        .route("/public/verify", post(public_verify_proof)) // Public endpoint for verification
}

async fn generate_proof(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Json(request): Json<GenerateProofRequest>,
) -> Result<(StatusCode, Json<ProofResponse>), AppError> {
    // Validate request
    request.validate().map_err(validation_error)?;

    let response = state.zk_proof_service
        .generate_proof(request, auth_user.user.id)
        .await?;

    Ok((StatusCode::CREATED, Json(response)))
}

async fn verify_proof(
    State(state): State<AppState>,
    auth_user: AuthUser,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    headers: HeaderMap,
    Json(request): Json<VerifyProofRequest>,
) -> Result<Json<VerificationResponse>, AppError> {
    // Validate request
    request.validate().map_err(validation_error)?;

    let user_agent = headers
        .get("user-agent")
        .and_then(|h| h.to_str().ok())
        .map(|s| s.to_string());

    let response = state.zk_proof_service
        .verify_proof(
            request,
            Some(auth_user.user.id),
            Some(addr.ip()),
            user_agent,
        )
        .await?;

    Ok(Json(response))
}

async fn public_verify_proof(
    State(state): State<AppState>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    headers: HeaderMap,
    Json(request): Json<VerifyProofRequest>,
) -> Result<Json<VerificationResponse>, AppError> {
    // Validate request
    request.validate().map_err(validation_error)?;

    let user_agent = headers
        .get("user-agent")
        .and_then(|h| h.to_str().ok())
        .map(|s| s.to_string());

    let response = state.zk_proof_service
        .verify_proof(
            request,
            None, // No authenticated user for public verification
            Some(addr.ip()),
            user_agent,
        )
        .await?;

    Ok(Json(response))
}

#[derive(serde::Deserialize)]
struct ProofQuery {
    page: Option<u32>,
    limit: Option<u32>,
}

async fn get_user_proofs(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Query(query): Query<ProofQuery>,
) -> Result<Json<Vec<ProofResponse>>, AppError> {
    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(20).min(100); // Cap at 100 items per page

    let proofs = state.zk_proof_service
        .get_user_proofs(auth_user.user.id, page, limit)
        .await?;

    Ok(Json(proofs))
}

async fn get_proof(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Path(proof_id): Path<Uuid>,
) -> Result<Json<ProofResponse>, AppError> {
    // Get all user proofs and find the specific one
    let proofs = state.zk_proof_service
        .get_user_proofs(auth_user.user.id, 1, 1000)
        .await?;

    let proof = proofs
        .into_iter()
        .find(|p| p.id == proof_id)
        .ok_or_else(|| AppError::NotFound("Proof not found or access denied".to_string()))?;

    Ok(Json(proof))
}

async fn revoke_proof(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Path(proof_id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    state.zk_proof_service
        .revoke_proof(proof_id, auth_user.user.id)
        .await?;

    Ok(StatusCode::NO_CONTENT)
}
