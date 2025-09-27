-- Initial database schema for ZK Health Pass

-- Users table for authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'patient', -- patient, provider, verifier, admin
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health authorities/providers
CREATE TABLE health_authorities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    authority_type VARCHAR(100) NOT NULL, -- hospital, clinic, lab, government
    public_key TEXT NOT NULL, -- secp256k1 public key for signature verification
    certificate TEXT, -- X.509 certificate for authority validation
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health records
CREATE TABLE health_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    authority_id UUID NOT NULL REFERENCES health_authorities(id),
    record_type VARCHAR(50) NOT NULL, -- vaccination, test_result, medical_clearance, immunity_proof
    patient_identifier VARCHAR(255) NOT NULL,
    details JSONB NOT NULL, -- Flexible JSON structure for different record types
    issue_date DATE NOT NULL,
    expiry_date DATE,
    signature_r BYTEA NOT NULL, -- ECDSA signature r component
    signature_s BYTEA NOT NULL, -- ECDSA signature s component
    message_hash BYTEA NOT NULL, -- SHA-256 hash of the signed message
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Zero-knowledge proofs generated from health records
CREATE TABLE zk_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    health_record_id UUID NOT NULL REFERENCES health_records(id) ON DELETE CASCADE,
    proof_data BYTEA NOT NULL, -- Serialized ZK proof
    verification_key BYTEA NOT NULL, -- Public verification key
    proof_type VARCHAR(50) NOT NULL, -- ecdsa_signature_verification
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration for proofs
    usage_count INTEGER DEFAULT 0, -- Track how many times proof was verified
    max_usage INTEGER -- Optional limit on proof usage
);

-- Proof verification logs (for audit trail)
CREATE TABLE proof_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proof_id UUID NOT NULL REFERENCES zk_proofs(id),
    verifier_id UUID REFERENCES users(id), -- Who verified the proof
    verification_result BOOLEAN NOT NULL,
    verification_context JSONB, -- Additional context about verification
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- API keys for external integrations
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    permissions JSONB NOT NULL DEFAULT '[]', -- Array of permissions
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_health_records_user_id ON health_records(user_id);
CREATE INDEX idx_health_records_authority_id ON health_records(authority_id);
CREATE INDEX idx_health_records_type ON health_records(record_type);
CREATE INDEX idx_health_records_issue_date ON health_records(issue_date);
CREATE INDEX idx_zk_proofs_health_record_id ON zk_proofs(health_record_id);
CREATE INDEX idx_zk_proofs_generated_at ON zk_proofs(generated_at);
CREATE INDEX idx_proof_verifications_proof_id ON proof_verifications(proof_id);
CREATE INDEX idx_proof_verifications_verified_at ON proof_verifications(verified_at);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_authorities_updated_at BEFORE UPDATE ON health_authorities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_records_updated_at BEFORE UPDATE ON health_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
