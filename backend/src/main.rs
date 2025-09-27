mod config;
mod errors;
mod middleware;
mod models;
mod routes;
mod services;

use anyhow::Result;
use axum::Router;
use sqlx::postgres::PgPoolOptions;
use std::sync::Arc;
use tokio::net::TcpListener;
use tower::ServiceBuilder;
use tower_http::{
    cors::CorsLayer,
    trace::TraceLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::{
    config::Config,
    services::{AuthService, ZkProofService, CryptoService},
};

#[derive(Clone)]
pub struct AppState {
    pub auth_service: Arc<AuthService>,
    pub zk_proof_service: Arc<ZkProofService>,
    pub crypto_service: Arc<CryptoService>,
}

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "zk_health_pass_backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    let config = Config::from_env()?;

    // Setup database connection
    let db_pool = PgPoolOptions::new()
        .max_connections(20)
        .connect(&config.database_url)
        .await?;

    // Run database migrations
    sqlx::migrate!("./migrations").run(&db_pool).await?;

    // Initialize services
    let crypto_service = Arc::new(CryptoService::new());
    let auth_service = Arc::new(AuthService::new(
        db_pool.clone(),
        config.jwt_secret.clone(),
        config.jwt_expiration_hours,
    ));
    let zk_proof_service = Arc::new(ZkProofService::new(
        db_pool.clone(),
        crypto_service.clone(),
        config.noir_circuit_path.clone(),
    ));

    // Create application state
    let app_state = AppState {
        auth_service,
        zk_proof_service,
        crypto_service,
    };

    // Build the application with middleware
    let app = Router::new()
        .merge(routes::create_routes())
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(CorsLayer::permissive()) // Configure CORS as needed
        )
        .with_state(app_state);

    // Start the server
    let listener = TcpListener::bind(&config.server_address).await?;
    tracing::info!("🚀 ZK Health Pass API server starting on {}", config.server_address);
    
    axum::serve(listener, app).await?;

    Ok(())
}
