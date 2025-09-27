# ZK Health Pass 🏥🔐

A Zero-Knowledge Health Passport system that allows verification of health credentials (like vaccination certificates) using zero-knowledge proofs without revealing sensitive health data.

## 🎯 Overview

This project demonstrates how to verify health records using ECDSA signatures in a zero-knowledge circuit built with Noir. Users can prove they have a valid, signed health certificate without revealing its contents.

## 🏗️ Architecture

```
zk_health_pass/
├── generate_inputs/    # Rust program for creating ECDSA inputs
├── noir/              # Noir circuit for ZK verification
├── backend/           # (Future: API development)
├── contracts/         # (Future: Smart contracts)
└── config/           # (Future: Configuration files)
```

### Components

1. **Input Generator** (`generate_inputs/` - Rust)
   - Creates ECDSA signatures for health records
   - Uses secp256k1 elliptic curve cryptography
   - Generates properly formatted inputs for the Noir circuit
   - Handles SHA-256 hashing outside the circuit

2. **Zero-Knowledge Circuit** (`noir/` - Noir language)
   - Verifies ECDSA signatures in zero-knowledge
   - Validates public key integrity
   - Proves signature validity without revealing the signed message

## 🚀 Getting Started

### Prerequisites

- **Rust** (1.89.0 or later)
- **Cargo** (1.89.0 or later)

### Installation

1. **Install Rust** (if not already installed):
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source ~/.cargo/env
   ```

2. **Install Noir** (if not already installed):
   ```bash
   curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
   noirup
   ```

3. **Clone and setup the project**:
   ```bash
   cd /path/to/zk_health_pass
   ```

## 🚀 Quick Start

**Basic Demo:**
```bash
cd /home/wilfred/Projects/zk_health_pass
./run_demo.sh          # Basic demo
./demo_enhanced.sh     # Enhanced demo with multiple record types
```

## 📖 Usage

### Step 1: Generate ECDSA Inputs

**Quick Start (Default):**
```bash
cd generate_inputs
cargo run -- default
```

**Using Templates:**
```bash
# List available templates
cargo run -- list

# Use a specific template
cargo run -- template --name covid_vaccination
cargo run -- template --name negative_test
cargo run -- template --name medical_clearance
cargo run -- template --name immunity_proof
```

**Custom Health Records:**
```bash
cargo run -- custom \
    --patient-id "Patient123" \
    --details "COVID19_Booster" \
    --record-type "vaccination" \
    --date "2025-09-27" \
    --issuer "HealthDept"
```

This will:
- Generate a health record signature for your chosen record type
- Create a `Prover.toml` file with the necessary cryptographic inputs
- Verify the signature in Rust before proceeding

Expected output:
```
🔐 Generating working ECDSA inputs for Noir...
📋 Using pre-computed hash approach (no SHA-256 in circuit)

📝 Health record: 'VaxRecord:Patient123_COVID19_Dose1_2025'
🔍 Message hash: 0x1ffdcddd748313eb96986b3b117f7726222a2402d6c7acae0d9bc079b6068a3c
✅ Signature verified successfully in Rust
🔧 Signature normalized (low-S): true (s[0] = 0x5d)

🎯 Successfully generated Prover.toml!
```

#### Step 2: Copy Inputs to Noir Circuit

```bash
cp generate_inputs/Prover.toml noir/Prover.toml
```

#### Step 3: Verify and Execute the Circuit

```bash
cd noir

# Check circuit compilation
nargo check

# Execute the circuit (generate witness)
nargo execute

# Run tests (if any)
nargo test
```

Expected output:
```
[health_passport_circuit] Circuit witness successfully solved
[health_passport_circuit] Witness saved to target/health_passport_circuit.gz
```

## 🔧 Technical Details

### Health Record Format
```
"VaxRecord:Patient123_COVID19_Dose1_2025"
```

### Cryptographic Components
- **Elliptic Curve**: secp256k1
- **Hash Function**: SHA-256 (computed outside circuit)
- **Signature Scheme**: ECDSA with signature normalization
- **Private Key**: Deterministic (for testing): `0x0000...0001`

### Circuit Verification Process
1. Takes message hash, public key coordinates, and signature components as inputs
2. Reconstructs the signature from r and s components
3. Verifies ECDSA signature using Noir's built-in verification
4. Validates public key is non-zero
5. Asserts all verifications pass

### Key Features
- ✅ Pre-computed message hash (avoids SHA-256 in circuit)
- ✅ Signature normalization for Noir compatibility
- ✅ Comprehensive input validation
- ✅ Zero-knowledge proof generation
- ✅ Deterministic testing setup

## 🧪 Testing

The project includes comprehensive testing:

1. **Rust Input Generation**: Verifies signature creation and normalization
2. **Noir Circuit**: Validates ECDSA verification in zero-knowledge
3. **End-to-End**: Complete workflow from input generation to proof creation

## 🔒 Security Considerations

- Uses deterministic private key for **testing only**
- In production, use secure key generation and management
- Message hash is computed outside the circuit for efficiency
- Signature normalization ensures compatibility with Noir's ECDSA implementation

## 🚧 Future Development

The project structure includes placeholders for:

- **Backend API** (`backend/`): REST API for proof generation and verification
- **Smart Contracts** (`contracts/`): Blockchain integration for decentralized verification
- **Configuration** (`config/`): Environment-specific settings

## 📚 Resources

- [Noir Documentation](https://noir-lang.org/)
- [ECDSA Signature Scheme](https://en.wikipedia.org/wiki/Elliptic_Curve_Digital_Signature_Algorithm)
- [secp256k1 Curve](https://en.bitcoin.it/wiki/Secp256k1)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is for educational and demonstration purposes.

---

**Status**: ✅ **Working** - All components tested and functional

Last updated: September 2025
# VeryFi
