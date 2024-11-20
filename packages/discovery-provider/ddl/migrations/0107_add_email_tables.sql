begin;

-- Store encrypted emails with their metadata
CREATE TABLE IF NOT EXISTS encrypted_emails (
    id SERIAL PRIMARY KEY, 
    email_address_owner_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    primary_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    encrypted_email TEXT NOT NULL,  -- base64 encoded
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE encrypted_emails IS 'Stores encrypted emails and their metadata for secure communication between users';
COMMENT ON COLUMN encrypted_emails.email_address_owner_user_id IS 'User ID of the person who owns the actual email address';
COMMENT ON COLUMN encrypted_emails.primary_user_id IS 'User ID of the person who has full control over the encrypted email';
COMMENT ON COLUMN encrypted_emails.encrypted_email IS 'Base64 encoded encrypted email content';

-- Store the encryption keys for primary access holders
CREATE TABLE IF NOT EXISTS email_encryption_keys (
    id SERIAL PRIMARY KEY,
    primary_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    encrypted_key TEXT NOT NULL,  -- base64 encoded
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(primary_user_id)  -- one key per primary access holder
);

COMMENT ON TABLE email_encryption_keys IS 'Stores encryption keys for users with primary access to manage encrypted emails';
COMMENT ON COLUMN email_encryption_keys.primary_user_id IS 'User ID of the person with primary access';
COMMENT ON COLUMN email_encryption_keys.encrypted_key IS 'Base64 encoded encryption key for the primary access holder';

-- Store the encrypted keys for delegated access
CREATE TABLE IF NOT EXISTS email_access_keys (
    id SERIAL PRIMARY KEY,
    primary_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    delegated_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    encrypted_key TEXT NOT NULL,  -- base64 encoded
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(primary_user_id, delegated_user_id)  -- one key per primary-delegated pair
);

COMMENT ON TABLE email_access_keys IS 'Stores encrypted keys for users with delegated access to view emails';
COMMENT ON COLUMN email_access_keys.primary_user_id IS 'User ID of the person who granted access';
COMMENT ON COLUMN email_access_keys.delegated_user_id IS 'User ID of the person who received delegated access';
COMMENT ON COLUMN email_access_keys.encrypted_key IS 'Base64 encoded encryption key for the delegated access holder';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_encrypted_emails_primary_user_id ON encrypted_emails(primary_user_id);
CREATE INDEX IF NOT EXISTS idx_encrypted_emails_email_address_owner_user_id ON encrypted_emails(email_address_owner_user_id);
CREATE INDEX IF NOT EXISTS idx_email_access_keys_delegated_user_id ON email_access_keys(delegated_user_id);

commit;
