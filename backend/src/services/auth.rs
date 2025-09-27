use crate::models::{User, UserRole, CreateUserRequest, LoginRequest, LoginResponse, UserResponse};
use crate::errors::AppError;
use anyhow::Result;
use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use argon2::password_hash::{rand_core::OsRng, SaltString};
use chrono::{DateTime, Utc, Duration};
use jsonwebtoken::{encode, decode, Header, Algorithm, Validation, EncodingKey, DecodingKey};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // User ID
    pub email: String,
    pub role: UserRole,
    pub exp: i64, // Expiration timestamp
    pub iat: i64, // Issued at timestamp
}

pub struct AuthService {
    pub db: PgPool,
    jwt_secret: String,
    jwt_expiration_hours: i64,
}

impl AuthService {
    pub fn new(db: PgPool, jwt_secret: String, jwt_expiration_hours: i64) -> Self {
        Self {
            db,
            jwt_secret,
            jwt_expiration_hours,
        }
    }

    pub async fn register_user(&self, request: CreateUserRequest) -> Result<UserResponse, AppError> {
        // Check if user already exists
        let existing_user = sqlx::query_as::<_, User>(
            "SELECT * FROM users WHERE email = $1"
        )
        .bind(&request.email)
        .fetch_optional(&self.db)
        .await?;

        if existing_user.is_some() {
            return Err(AppError::Conflict("User with this email already exists".to_string()));
        }

        // Hash password
        let password_hash = self.hash_password(&request.password)?;

        // Create user
        let user = sqlx::query_as::<_, User>(
            r#"
            INSERT INTO users (email, password_hash, full_name, role)
            VALUES ($1, $2, $3, $4)
            RETURNING *
            "#
        )
        .bind(&request.email)
        .bind(&password_hash)
        .bind(&request.full_name)
        .bind(request.role.unwrap_or(UserRole::Patient))
        .fetch_one(&self.db)
        .await?;

        Ok(user.into())
    }

    pub async fn login(&self, request: LoginRequest) -> Result<LoginResponse, AppError> {
        // Find user by email
        let user = sqlx::query_as::<_, User>(
            "SELECT * FROM users WHERE email = $1"
        )
        .bind(&request.email)
        .fetch_optional(&self.db)
        .await?
        .ok_or_else(|| AppError::Unauthorized("Invalid credentials".to_string()))?;

        // Verify password
        if !self.verify_password(&request.password, &user.password_hash)? {
            return Err(AppError::Unauthorized("Invalid credentials".to_string()));
        }

        // Generate JWT token
        let expires_at = Utc::now() + Duration::hours(self.jwt_expiration_hours);
        let token = self.generate_token(&user, expires_at)?;

        Ok(LoginResponse {
            token,
            user: user.into(),
            expires_at,
        })
    }

    pub async fn get_user_by_id(&self, user_id: Uuid) -> Result<Option<User>, AppError> {
        let user = sqlx::query_as::<_, User>(
            "SELECT * FROM users WHERE id = $1"
        )
        .bind(user_id)
        .fetch_optional(&self.db)
        .await?;

        Ok(user)
    }

    pub fn verify_token(&self, token: &str) -> Result<Claims, AppError> {
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.jwt_secret.as_ref()),
            &Validation::new(Algorithm::HS256),
        )
        .map_err(|_| AppError::Unauthorized("Invalid token".to_string()))?;

        Ok(token_data.claims)
    }

    fn generate_token(&self, user: &User, expires_at: DateTime<Utc>) -> Result<String, AppError> {
        let claims = Claims {
            sub: user.id.to_string(),
            email: user.email.clone(),
            role: user.role.clone(),
            exp: expires_at.timestamp(),
            iat: Utc::now().timestamp(),
        };

        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.jwt_secret.as_ref()),
        )
        .map_err(|_| AppError::InternalServerError("Failed to generate token".to_string()))?;

        Ok(token)
    }

    fn hash_password(&self, password: &str) -> Result<String, AppError> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        
        let password_hash = argon2
            .hash_password(password.as_bytes(), &salt)
            .map_err(|_| AppError::InternalServerError("Failed to hash password".to_string()))?
            .to_string();

        Ok(password_hash)
    }

    fn verify_password(&self, password: &str, hash: &str) -> Result<bool, AppError> {
        let parsed_hash = PasswordHash::new(hash)
            .map_err(|_| AppError::InternalServerError("Invalid password hash".to_string()))?;

        let argon2 = Argon2::default();
        Ok(argon2.verify_password(password.as_bytes(), &parsed_hash).is_ok())
    }

    pub async fn update_user_verification(&self, user_id: Uuid, is_verified: bool) -> Result<(), AppError> {
        sqlx::query(
            "UPDATE users SET is_verified = $1, updated_at = NOW() WHERE id = $2"
        )
        .bind(is_verified)
        .bind(user_id)
        .execute(&self.db)
        .await?;

        Ok(())
    }

    pub async fn change_password(&self, user_id: Uuid, old_password: &str, new_password: &str) -> Result<(), AppError> {
        // Get current user
        let user = self.get_user_by_id(user_id).await?
            .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

        // Verify old password
        if !self.verify_password(old_password, &user.password_hash)? {
            return Err(AppError::Unauthorized("Current password is incorrect".to_string()));
        }

        // Hash new password
        let new_password_hash = self.hash_password(new_password)?;

        // Update password
        sqlx::query(
            "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2"
        )
        .bind(&new_password_hash)
        .bind(user_id)
        .execute(&self.db)
        .await?;

        Ok(())
    }
}
