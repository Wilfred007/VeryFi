use anyhow::Result;
use serde::Deserialize;
use std::env;

#[derive(Debug, Deserialize, Clone)]
pub struct Config {
    pub server_address: String,
    pub database_url: String,
    pub jwt_secret: String,
    pub jwt_expiration_hours: i64,
    pub noir_circuit_path: String,
    pub cors_origins: Vec<String>,
    pub rate_limit_requests_per_minute: u64,
    pub max_proof_usage: Option<i32>,
    pub default_proof_expiration_hours: u32,
    // Blockchain configuration
    pub blockchain_enabled: bool,
    pub blockchain_network: String,
    pub blockchain_rpc_url: String,
    pub blockchain_private_key: String,
    pub zk_health_pass_registry_address: String,
    pub zk_proof_verifier_address: String,
    pub health_authority_registry_address: String,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        dotenvy::dotenv().ok(); // Load .env file if it exists

        Ok(Config {
            server_address: env::var("SERVER_ADDRESS")
                .unwrap_or_else(|_| "0.0.0.0:3000".to_string()),
            database_url: env::var("DATABASE_URL")
                .expect("DATABASE_URL must be set"),
            jwt_secret: env::var("JWT_SECRET")
                .expect("JWT_SECRET must be set"),
            jwt_expiration_hours: env::var("JWT_EXPIRATION_HOURS")
                .unwrap_or_else(|_| "24".to_string())
                .parse()
                .expect("JWT_EXPIRATION_HOURS must be a valid number"),
            noir_circuit_path: env::var("NOIR_CIRCUIT_PATH")
                .unwrap_or_else(|_| "../noir".to_string()),
            cors_origins: env::var("CORS_ORIGINS")
                .unwrap_or_else(|_| "http://localhost:3000,http://localhost:5173".to_string())
                .split(',')
                .map(|s| s.trim().to_string())
                .collect(),
            rate_limit_requests_per_minute: env::var("RATE_LIMIT_RPM")
                .unwrap_or_else(|_| "60".to_string())
                .parse()
                .expect("RATE_LIMIT_RPM must be a valid number"),
            max_proof_usage: env::var("MAX_PROOF_USAGE")
                .ok()
                .and_then(|s| s.parse().ok()),
            default_proof_expiration_hours: env::var("DEFAULT_PROOF_EXPIRATION_HOURS")
                .unwrap_or_else(|_| "24".to_string())
                .parse()
                .expect("DEFAULT_PROOF_EXPIRATION_HOURS must be a valid number"),
            // Blockchain configuration
            blockchain_enabled: env::var("BLOCKCHAIN_ENABLED")
                .unwrap_or_else(|_| "false".to_string())
                .parse()
                .unwrap_or(false),
            blockchain_network: env::var("BLOCKCHAIN_NETWORK")
                .unwrap_or_else(|_| "lisk-sepolia".to_string()),
            blockchain_rpc_url: env::var("BLOCKCHAIN_RPC_URL")
                .unwrap_or_else(|_| "https://rpc.sepolia-api.lisk.com".to_string()),
            blockchain_private_key: env::var("BLOCKCHAIN_PRIVATE_KEY")
                .unwrap_or_else(|_| "".to_string()),
            zk_health_pass_registry_address: env::var("ZK_HEALTH_PASS_REGISTRY_ADDRESS")
                .unwrap_or_else(|_| "".to_string()),
            zk_proof_verifier_address: env::var("ZK_PROOF_VERIFIER_ADDRESS")
                .unwrap_or_else(|_| "".to_string()),
            health_authority_registry_address: env::var("HEALTH_AUTHORITY_REGISTRY_ADDRESS")
                .unwrap_or_else(|_| "".to_string()),
        })
    }
}
