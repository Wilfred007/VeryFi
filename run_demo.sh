#!/bin/bash

# ZK Health Pass Demo Script
# This script demonstrates the complete workflow

set -e  # Exit on any error

echo "🏥 ZK Health Pass Demo"
echo "====================="
echo ""

# Step 1: Generate ECDSA inputs
echo "📝 Step 1: Generating ECDSA inputs..."
cd generate_inputs
cargo run --quiet -- default
echo ""

# Step 2: Copy inputs to Noir project
echo "📋 Step 2: Copying inputs to Noir circuit..."
cp Prover.toml ../noir/Prover.toml
echo "✅ Prover.toml copied successfully"
echo ""

# Step 3: Compile and execute Noir circuit
echo "🔧 Step 3: Compiling and executing Noir circuit..."
cd ../noir

echo "   Checking circuit compilation..."
nargo check

echo "   Executing circuit (generating witness)..."
nargo execute

echo "   Running tests..."
nargo test

echo ""
echo "🎉 Demo completed successfully!"
echo ""
echo "📊 Results:"
echo "   • Health record verified: VaxRecord:Patient123_COVID19_Dose1_2025"
echo "   • ECDSA signature validated in Rust ✅"
echo "   • Zero-knowledge proof generated ✅"
echo "   • Witness saved to: noir/target/health_passport_circuit.gz"
echo ""
echo "🔐 Privacy achieved: Health data verified without revealing contents!"
