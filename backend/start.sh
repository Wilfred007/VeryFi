#!/bin/bash

# ZK Health Pass Backend Startup Script

set -e

echo "🏥 Starting ZK Health Pass Backend"
echo "=================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📋 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration before running again"
    exit 1
fi

# Load environment variables
source .env

echo "🔧 Environment: ${RUST_LOG:-info}"
echo "🌐 Server will start on: ${SERVER_ADDRESS:-0.0.0.0:3000}"

# Check if PostgreSQL is running
echo "🗄️  Checking database connection..."
if ! pg_isready -h localhost -p 5432 -U ${DATABASE_URL##*@} > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running. Starting with Docker..."
    docker run --name zk-postgres -d \
        -e POSTGRES_DB=zk_health_pass \
        -e POSTGRES_USER=zkhealth \
        -e POSTGRES_PASSWORD=password \
        -p 5432:5432 \
        postgres:15-alpine
    
    echo "⏳ Waiting for PostgreSQL to start..."
    sleep 10
fi

# Install sqlx-cli if not present
if ! command -v sqlx &> /dev/null; then
    echo "📦 Installing sqlx-cli..."
    cargo install sqlx-cli --no-default-features --features postgres
fi

# Run database migrations
echo "🔄 Running database migrations..."
sqlx migrate run

# Check if Noir is available
if ! command -v nargo &> /dev/null; then
    echo "⚠️  Noir/Nargo not found. ZK proof generation may not work."
    echo "   Install with: curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash"
fi

# Build and run the application
echo "🚀 Building and starting the backend..."
if [ "${1:-}" = "--release" ]; then
    echo "📦 Building in release mode..."
    cargo build --release
    echo "✅ Starting ZK Health Pass Backend API..."
    ./target/release/zk-health-pass-backend
else
    echo "🔧 Running in development mode..."
    cargo run
fi
