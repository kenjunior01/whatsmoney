-- Update users table to match NextAuth requirements
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned'));

-- Update existing users to have active status
UPDATE users SET status = 'active' WHERE status IS NULL;
UPDATE users SET email_verified = verified WHERE email_verified IS NULL;

-- Create indexes for auth performance
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
