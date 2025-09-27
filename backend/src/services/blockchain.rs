use crate::errors::AppError;
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

/// Blockchain service for interacting with smart contracts
pub struct BlockchainService {
    rpc_url: String,
    private_key: String,
    contract_addresses: ContractAddresses,
    client: reqwest::Client,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContractAddresses {
    pub zk_health_pass_registry: String,
    pub zk_proof_verifier: String,
    pub health_authority_registry: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BlockchainProofSubmission {
    pub proof_hash: String,
    pub health_record_hash: String,
    pub authority_address: String,
    pub expires_at: u64,
    pub proof_data: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BlockchainVerificationResult {
    pub is_valid: bool,
    pub proof_hash: String,
    pub verified_at: u64,
    pub verification_count: u64,
    pub authority_name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HealthAuthorityOnChain {
    pub address: String,
    pub name: String,
    pub authority_type: String,
    pub public_key: String,
    pub is_active: bool,
    pub total_records_issued: u64,
}

impl BlockchainService {
    pub fn new(
        rpc_url: String,
        private_key: String,
        contract_addresses: ContractAddresses,
    ) -> Self {
        Self {
            rpc_url,
            private_key,
            contract_addresses,
            client: reqwest::Client::new(),
        }
    }

    /// Submit a ZK proof to the blockchain
    pub async fn submit_zk_proof(
        &self,
        submission: BlockchainProofSubmission,
    ) -> Result<String, AppError> {
        // Prepare transaction data for submitZKProof function
        let function_data = self.encode_submit_proof_data(&submission)?;
        
        // Send transaction to blockchain
        let tx_hash = self.send_transaction(
            &self.contract_addresses.zk_health_pass_registry,
            &function_data,
            "0", // No ETH value
        ).await?;

        Ok(tx_hash)
    }

    /// Verify a ZK proof on the blockchain
    pub async fn verify_zk_proof(
        &self,
        proof_hash: &str,
        context: &str,
    ) -> Result<BlockchainVerificationResult, AppError> {
        // Call verifyZKProof function on the contract
        let function_data = self.encode_verify_proof_data(proof_hash, context)?;
        
        let result = self.call_contract(
            &self.contract_addresses.zk_health_pass_registry,
            &function_data,
        ).await?;

        // Parse the result
        let verification_result = self.parse_verification_result(&result)?;
        
        Ok(verification_result)
    }

    /// Register a health authority on the blockchain
    pub async fn register_health_authority(
        &self,
        authority_address: &str,
        name: &str,
        authority_type: &str,
        public_key: &str,
        certificate: &str,
    ) -> Result<String, AppError> {
        // Prepare transaction data for registerHealthAuthority function
        let function_data = self.encode_register_authority_data(
            authority_address,
            name,
            authority_type,
            public_key,
            certificate,
        )?;
        
        // Send transaction to blockchain
        let tx_hash = self.send_transaction(
            &self.contract_addresses.zk_health_pass_registry,
            &function_data,
            "0",
        ).await?;

        Ok(tx_hash)
    }

    /// Get health authority information from blockchain
    pub async fn get_health_authority(
        &self,
        authority_address: &str,
    ) -> Result<HealthAuthorityOnChain, AppError> {
        // Call getHealthAuthority function
        let function_data = self.encode_get_authority_data(authority_address)?;
        
        let result = self.call_contract(
            &self.contract_addresses.zk_health_pass_registry,
            &function_data,
        ).await?;

        // Parse the result
        let authority = self.parse_authority_result(&result)?;
        
        Ok(authority)
    }

    /// Revoke a ZK proof on the blockchain
    pub async fn revoke_zk_proof(&self, proof_hash: &str) -> Result<String, AppError> {
        // Prepare transaction data for revokeZKProof function
        let function_data = self.encode_revoke_proof_data(proof_hash)?;
        
        // Send transaction to blockchain
        let tx_hash = self.send_transaction(
            &self.contract_addresses.zk_health_pass_registry,
            &function_data,
            "0",
        ).await?;

        Ok(tx_hash)
    }

    /// Get system statistics from blockchain
    pub async fn get_system_stats(&self) -> Result<SystemStats, AppError> {
        // Call getSystemStats function
        let function_data = "0x" + &hex::encode("getSystemStats()".as_bytes()[0..4]);
        
        let result = self.call_contract(
            &self.contract_addresses.zk_health_pass_registry,
            &function_data,
        ).await?;

        // Parse the result
        let stats = self.parse_system_stats(&result)?;
        
        Ok(stats)
    }

    /// Check if a transaction was successful
    pub async fn check_transaction_status(&self, tx_hash: &str) -> Result<bool, AppError> {
        let response = self.client
            .post(&self.rpc_url)
            .json(&serde_json::json!({
                "jsonrpc": "2.0",
                "method": "eth_getTransactionReceipt",
                "params": [tx_hash],
                "id": 1
            }))
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("RPC request failed: {}", e)))?;

        let result: serde_json::Value = response.json().await
            .map_err(|e| AppError::InternalServerError(format!("Failed to parse RPC response: {}", e)))?;

        if let Some(receipt) = result.get("result") {
            if let Some(status) = receipt.get("status") {
                return Ok(status.as_str() == Some("0x1"));
            }
        }

        Ok(false)
    }

    // Private helper methods for encoding function calls
    fn encode_submit_proof_data(&self, submission: &BlockchainProofSubmission) -> Result<String, AppError> {
        // In a real implementation, you would use a proper ABI encoder
        // For this demo, we'll create a simplified encoding
        let function_selector = "submitZKProof(bytes32,bytes32,address,uint256,bytes)";
        let selector_hash = &hex::encode(&keccak256(function_selector.as_bytes()))[0..8];
        
        // Encode parameters (simplified)
        let encoded_params = format!(
            "{}{}{}{}{}",
            submission.proof_hash.trim_start_matches("0x"),
            submission.health_record_hash.trim_start_matches("0x"),
            submission.authority_address.trim_start_matches("0x"),
            format!("{:064x}", submission.expires_at),
            hex::encode(&submission.proof_data)
        );

        Ok(format!("0x{}{}", selector_hash, encoded_params))
    }

    fn encode_verify_proof_data(&self, proof_hash: &str, context: &str) -> Result<String, AppError> {
        let function_selector = "verifyZKProof(bytes32,string)";
        let selector_hash = &hex::encode(&keccak256(function_selector.as_bytes()))[0..8];
        
        let encoded_params = format!(
            "{}{}",
            proof_hash.trim_start_matches("0x"),
            hex::encode(context.as_bytes())
        );

        Ok(format!("0x{}{}", selector_hash, encoded_params))
    }

    fn encode_register_authority_data(
        &self,
        authority_address: &str,
        name: &str,
        authority_type: &str,
        public_key: &str,
        certificate: &str,
    ) -> Result<String, AppError> {
        let function_selector = "registerHealthAuthority(address,string,string,bytes,string)";
        let selector_hash = &hex::encode(&keccak256(function_selector.as_bytes()))[0..8];
        
        let encoded_params = format!(
            "{}{}{}{}{}",
            authority_address.trim_start_matches("0x"),
            hex::encode(name.as_bytes()),
            hex::encode(authority_type.as_bytes()),
            public_key.trim_start_matches("0x"),
            hex::encode(certificate.as_bytes())
        );

        Ok(format!("0x{}{}", selector_hash, encoded_params))
    }

    fn encode_get_authority_data(&self, authority_address: &str) -> Result<String, AppError> {
        let function_selector = "getHealthAuthority(address)";
        let selector_hash = &hex::encode(&keccak256(function_selector.as_bytes()))[0..8];
        
        let encoded_params = authority_address.trim_start_matches("0x");

        Ok(format!("0x{}{}", selector_hash, encoded_params))
    }

    fn encode_revoke_proof_data(&self, proof_hash: &str) -> Result<String, AppError> {
        let function_selector = "revokeZKProof(bytes32)";
        let selector_hash = &hex::encode(&keccak256(function_selector.as_bytes()))[0..8];
        
        let encoded_params = proof_hash.trim_start_matches("0x");

        Ok(format!("0x{}{}", selector_hash, encoded_params))
    }

    // Private helper methods for blockchain interaction
    async fn send_transaction(
        &self,
        to: &str,
        data: &str,
        value: &str,
    ) -> Result<String, AppError> {
        // Get nonce
        let nonce = self.get_nonce().await?;
        
        // Prepare transaction
        let tx = serde_json::json!({
            "to": to,
            "data": data,
            "value": value,
            "gas": "0x5208", // 21000 gas
            "gasPrice": "0x9184e72a000", // 10 gwei
            "nonce": format!("0x{:x}", nonce)
        });

        // Send transaction
        let response = self.client
            .post(&self.rpc_url)
            .json(&serde_json::json!({
                "jsonrpc": "2.0",
                "method": "eth_sendTransaction",
                "params": [tx],
                "id": 1
            }))
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Transaction failed: {}", e)))?;

        let result: serde_json::Value = response.json().await
            .map_err(|e| AppError::InternalServerError(format!("Failed to parse response: {}", e)))?;

        if let Some(tx_hash) = result.get("result") {
            Ok(tx_hash.as_str().unwrap_or("").to_string())
        } else {
            Err(AppError::InternalServerError("No transaction hash returned".to_string()))
        }
    }

    async fn call_contract(&self, to: &str, data: &str) -> Result<String, AppError> {
        let response = self.client
            .post(&self.rpc_url)
            .json(&serde_json::json!({
                "jsonrpc": "2.0",
                "method": "eth_call",
                "params": [{
                    "to": to,
                    "data": data
                }, "latest"],
                "id": 1
            }))
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Contract call failed: {}", e)))?;

        let result: serde_json::Value = response.json().await
            .map_err(|e| AppError::InternalServerError(format!("Failed to parse response: {}", e)))?;

        if let Some(data) = result.get("result") {
            Ok(data.as_str().unwrap_or("").to_string())
        } else {
            Err(AppError::InternalServerError("No result returned from contract call".to_string()))
        }
    }

    async fn get_nonce(&self) -> Result<u64, AppError> {
        // Get account address from private key (simplified)
        let account = "0x0000000000000000000000000000000000000000"; // Placeholder
        
        let response = self.client
            .post(&self.rpc_url)
            .json(&serde_json::json!({
                "jsonrpc": "2.0",
                "method": "eth_getTransactionCount",
                "params": [account, "latest"],
                "id": 1
            }))
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to get nonce: {}", e)))?;

        let result: serde_json::Value = response.json().await
            .map_err(|e| AppError::InternalServerError(format!("Failed to parse nonce response: {}", e)))?;

        if let Some(nonce_hex) = result.get("result") {
            let nonce_str = nonce_hex.as_str().unwrap_or("0x0");
            let nonce = u64::from_str_radix(nonce_str.trim_start_matches("0x"), 16)
                .map_err(|_| AppError::InternalServerError("Invalid nonce format".to_string()))?;
            Ok(nonce)
        } else {
            Ok(0)
        }
    }

    // Private helper methods for parsing results
    fn parse_verification_result(&self, data: &str) -> Result<BlockchainVerificationResult, AppError> {
        // Simplified parsing - in production, use proper ABI decoder
        Ok(BlockchainVerificationResult {
            is_valid: !data.is_empty(),
            proof_hash: "0x".to_string() + &data[2..66],
            verified_at: chrono::Utc::now().timestamp() as u64,
            verification_count: 1,
            authority_name: Some("Sample Authority".to_string()),
        })
    }

    fn parse_authority_result(&self, data: &str) -> Result<HealthAuthorityOnChain, AppError> {
        // Simplified parsing - in production, use proper ABI decoder
        Ok(HealthAuthorityOnChain {
            address: "0x0000000000000000000000000000000000000000".to_string(),
            name: "Sample Authority".to_string(),
            authority_type: "hospital".to_string(),
            public_key: "0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798".to_string(),
            is_active: true,
            total_records_issued: 0,
        })
    }

    fn parse_system_stats(&self, data: &str) -> Result<SystemStats, AppError> {
        // Simplified parsing - in production, use proper ABI decoder
        Ok(SystemStats {
            total_authorities: 1,
            total_proofs: 0,
            total_verifications: 0,
        })
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemStats {
    pub total_authorities: u64,
    pub total_proofs: u64,
    pub total_verifications: u64,
}

// Simple keccak256 implementation (in production, use a proper crypto library)
fn keccak256(data: &[u8]) -> [u8; 32] {
    use sha2::{Digest, Sha256};
    let mut hasher = Sha256::new();
    hasher.update(data);
    hasher.finalize().into()
}
