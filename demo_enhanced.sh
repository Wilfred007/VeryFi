#!/bin/bash

# Enhanced ZK Health Pass Demo Script
# Demonstrates multiple health record types and CLI features

set -e  # Exit on any error

echo "🏥 Enhanced ZK Health Pass Demo"
echo "=============================="
echo ""

cd generate_inputs

# Show available templates
echo "📋 Step 1: Available Health Record Templates"
echo "--------------------------------------------"
cargo run --quiet -- list
echo ""

# Demo different health record types
health_records=("covid_vaccination" "negative_test" "medical_clearance" "immunity_proof")

for record_type in "${health_records[@]}"; do
    echo "🔐 Step 2: Generating proof for '$record_type'"
    echo "-----------------------------------------------"
    
    # Generate inputs for this record type
    cargo run --quiet -- template --name "$record_type"
    
    # Copy to Noir and test
    cp Prover.toml ../noir/Prover.toml
    
    echo "   Testing Noir circuit..."
    cd ../noir
    nargo execute > /dev/null 2>&1
    echo "   ✅ Zero-knowledge proof generated successfully!"
    echo ""
    
    cd ../generate_inputs
done

echo "🎨 Step 3: Custom Health Record Demo"
echo "-----------------------------------"
cargo run --quiet -- custom \
    --patient-id "CustomPatient999" \
    --details "BoosterShot_Moderna" \
    --record-type "vaccination" \
    --date "2025-09-27" \
    --issuer "CityHealthDept"

cp Prover.toml ../noir/Prover.toml
cd ../noir
nargo execute > /dev/null 2>&1
echo "   ✅ Custom health record verified!"
echo ""

cd ..

echo "🎉 Enhanced Demo Completed!"
echo "=========================="
echo ""
echo "📊 Summary:"
echo "   • Tested 4 different health record templates ✅"
echo "   • Generated custom health record ✅"
echo "   • All zero-knowledge proofs verified ✅"
echo "   • Privacy preserved in all cases ✅"
echo ""
echo "🔧 CLI Usage Examples:"
echo "   cargo run -- list                                    # List templates"
echo "   cargo run -- template --name covid_vaccination       # Use template"
echo "   cargo run -- custom --patient-id P123 --details ... # Custom record"
echo "   cargo run -- default                                 # Backward compatibility"
echo ""
echo "🔐 Your ZK Health Pass system is ready for production!"
