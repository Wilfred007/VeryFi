use secp256k1::{Message, Secp256k1, SecretKey, PublicKey};
use sha2::{Digest, Sha256};
use std::fs;
use hex;
use clap::Parser;

mod health_records;
mod cli;

use health_records::{HealthRecord, HealthRecordType, HealthRecordTemplates};
use cli::{Cli, Commands};

fn main() {
    let cli = Cli::parse();
    
    println!("🔐 ZK Health Pass Input Generator");
    println!("📋 Using pre-computed hash approach (no SHA-256 in circuit)\n");
    
    // Determine which health record to use
    let health_record = match cli.command {
        Commands::Template { name } => {
            let templates = HealthRecordTemplates::get_templates();
            match templates.get(name.as_str()) {
                Some(record) => record.clone(),
                None => {
                    eprintln!("❌ Template '{}' not found!", name);
                    eprintln!("Available templates: {:?}", HealthRecordTemplates::list_available());
                    std::process::exit(1);
                }
            }
        }
        Commands::Custom { patient_id, details, record_type, date, issuer } => {
            let rt = match record_type.to_lowercase().as_str() {
                "vaccination" => HealthRecordType::Vaccination,
                "test" => HealthRecordType::TestResult,
                "clearance" => HealthRecordType::MedicalClearance,
                "immunity" => HealthRecordType::ImmunityProof,
                _ => {
                    eprintln!("❌ Invalid record type: {}", record_type);
                    eprintln!("Valid types: vaccination, test, clearance, immunity");
                    std::process::exit(1);
                }
            };
            HealthRecord::new(rt, patient_id, details, date, issuer)
        }
        Commands::List => {
            println!("📋 Available Health Record Templates:");
            let templates = HealthRecordTemplates::get_templates();
            for (name, record) in templates.iter() {
                println!("  • {}: {}", name, record.to_signable_string());
            }
            return;
        }
        Commands::Default => {
            // Default behavior for backward compatibility
            HealthRecord::new(
                HealthRecordType::Vaccination,
                "Patient123".to_string(),
                "COVID19_Dose1".to_string(),
                "2025".to_string(),
                "HealthAuthority".to_string(),
            )
        }
    };

    let message_str = health_record.to_signable_string();
    println!("📝 Health record: '{}'", message_str);
    
    generate_ecdsa_inputs(&message_str);
}

fn generate_ecdsa_inputs(message_str: &str) {
    // Initialize secp256k1 context
    let secp = Secp256k1::signing_only();
    
    // Use deterministic private key for testing
    let secret_bytes = [
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01
    ];
    
    let secret_key = SecretKey::from_slice(&secret_bytes).expect("Valid private key");
    let public_key = PublicKey::from_secret_key(&secp, &secret_key);
    let public_key_bytes = public_key.serialize_uncompressed();
    
    // Extract public key coordinates (skip 0x04 prefix)
    let pubkey_x_bytes = &public_key_bytes[1..33];
    let pubkey_y_bytes = &public_key_bytes[33..65];
    
    // Convert message to bytes (pad with zeros if needed)
    let mut message_bytes = [0u8; 32];
    let msg_bytes = message_str.as_bytes();
    let copy_len = std::cmp::min(msg_bytes.len(), 32);
    message_bytes[..copy_len].copy_from_slice(&msg_bytes[..copy_len]);
    
    // ⭐ COMPUTE SHA-256 HASH OUTSIDE THE CIRCUIT ⭐
    let mut hasher = Sha256::new();
    hasher.update(&message_bytes);
    let msg_hash_bytes = hasher.finalize();
    let msg_hash_array: [u8; 32] = msg_hash_bytes.into();
    
    println!("🔍 Message hash: 0x{}", hex::encode(&msg_hash_array));
    
    // Sign the message hash
    let message_obj = Message::from_digest_slice(&msg_hash_array).expect("32 bytes");
    let mut signature = secp.sign_ecdsa(&message_obj, &secret_key);
    
    // ⭐ CRITICAL: Normalize signature for Noir compatibility ⭐
    signature.normalize_s();
    
    let signature_bytes = signature.serialize_compact();
    let signature_r_bytes = &signature_bytes[0..32];
    let signature_s_bytes = &signature_bytes[32..64];
    
    // Verify signature works in Rust first
    let verify_secp = Secp256k1::verification_only();
    match verify_secp.verify_ecdsa(&message_obj, &signature, &public_key) {
        Ok(_) => println!("✅ Signature verified successfully in Rust"),
        Err(e) => {
            eprintln!("❌ Signature verification failed in Rust: {:?}", e);
            panic!("Cannot proceed with invalid signature");
        }
    }
    
    // Check signature normalization
    let s_first_byte = signature_s_bytes[0];
    let is_normalized = s_first_byte < 0x80;
    println!("🔧 Signature normalized (low-S): {} (s[0] = 0x{:02x})", is_normalized, s_first_byte);
    
    if !is_normalized {
        println!("⚠️  Warning: Signature may not be properly normalized for Noir");
    }
    
    // Format byte arrays for Prover.toml (Noir expects string format)
    let format_byte_array = |bytes: &[u8]| -> String {
        let hex_values: Vec<String> = bytes.iter().map(|b| format!("\"0x{:02x}\"", b)).collect();
        format!("[{}]", hex_values.join(", "))
    };
    
    // Create Prover.toml content
    let prover_toml = format!(
        r#"msg_hash = {}
pubkey_x = {}
pubkey_y = {}
signature_r = {}
signature_s = {}
"#,
        format_byte_array(&msg_hash_array),
        format_byte_array(pubkey_x_bytes),
        format_byte_array(pubkey_y_bytes),
        format_byte_array(signature_r_bytes),
        format_byte_array(signature_s_bytes)
    );

    // Write to file
    fs::write("Prover.toml", &prover_toml).expect("Failed to write Prover.toml");
    
    println!("\n🎯 Successfully generated Prover.toml!");
    println!("📁 Location: ./Prover.toml");
    
    // Print the first few lines to verify
    println!("\n📄 Generated file preview:");
    let lines: Vec<&str> = prover_toml.lines().take(8).collect();
    for line in lines {
        println!("   {}", line);
    }
    println!("   ...");
    
    println!("\n📊 Verification Details:");
    println!("  • Private key: 0x{}", hex::encode(&secret_bytes));
    println!("  • Message: '{}'", message_str);
    println!("  • Message hash: 0x{}", hex::encode(&msg_hash_array));
    println!("  • Signature verified: ✅");
    println!("  • Signature normalized: {}", if is_normalized { "✅" } else { "⚠️" });
    
    println!("\n🚀 Next Steps:");
    println!("  1. Copy this Prover.toml to your Noir project directory");
    println!("  2. Replace your main.nr with the working circuit code");
    println!("  3. Run: nargo check");
    println!("  4. Run: nargo prove");
    
    println!("\n💡 This approach avoids SHA-256 function name issues!");
}