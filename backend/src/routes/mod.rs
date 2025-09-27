pub mod auth;
pub mod health_records;
pub mod zk_proofs;
pub mod health_authorities;

use axum::{
    routing::{get, post},
    Router,
};
use crate::AppState;

pub fn create_routes() -> Router<AppState> {
    Router::new()
        // Health check
        .route("/health", get(health_check))
        // API v1 routes
        .nest("/api/v1/auth", auth::routes())
        .nest("/api/v1/health-records", health_records::routes())
        .nest("/api/v1/proofs", zk_proofs::routes())
        .nest("/api/v1/authorities", health_authorities::routes())
}

async fn health_check() -> &'static str {
    "ZK Health Pass API is running"
}
