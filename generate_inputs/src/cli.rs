use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "zk-health-generator")]
#[command(about = "Generate ECDSA inputs for ZK Health Pass verification")]
#[command(version = "1.0")]
pub struct Cli {
    #[command(subcommand)]
    pub command: Commands,
}

#[derive(Subcommand)]
pub enum Commands {
    /// Generate inputs for a specific health record template
    Template {
        /// Template name (covid_vaccination, negative_test, medical_clearance, immunity_proof)
        #[arg(short, long)]
        name: String,
    },
    /// Generate inputs for a custom health record
    Custom {
        /// Patient ID
        #[arg(short, long)]
        patient_id: String,
        /// Health record details
        #[arg(short, long)]
        details: String,
        /// Record type (vaccination, test, clearance, immunity)
        #[arg(short, long)]
        record_type: String,
        /// Date
        #[arg(long, default_value = "2025")]
        date: String,
        /// Issuer
        #[arg(short, long, default_value = "HealthAuthority")]
        issuer: String,
    },
    /// List available templates
    List,
    /// Generate with default example (for backward compatibility)
    Default,
}
