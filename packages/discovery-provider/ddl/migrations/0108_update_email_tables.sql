BEGIN;

-- Drop old tables that we're replacing
DROP TABLE IF EXISTS email_encryption_keys;
DROP TABLE IF EXISTS email_access_keys;

-- Modify existing encrypted_emails table
ALTER TABLE encrypted_emails
    DROP CONSTRAINT IF EXISTS encrypted_emails_email_owner_user_id_primary_user_id_key,
    DROP COLUMN IF EXISTS primary_user_id,
    ADD CONSTRAINT encrypted_emails_email_owner_user_id_key UNIQUE (email_owner_user_id);

-- Create new email_access table
CREATE TABLE IF NOT EXISTS email_access (
    id SERIAL PRIMARY KEY,
    email_owner_user_id INTEGER NOT NULL,  -- references the owner of the email
    receiving_user_id INTEGER NOT NULL,    -- user who can access the email
    grantor_user_id INTEGER NOT NULL,      -- user who granted access
    encrypted_key TEXT NOT NULL,           -- SK encrypted for receiving_user
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (email_owner_user_id, receiving_user_id, grantor_user_id)
);

-- Add indexes for performance
CREATE INDEX idx_email_access_receiver ON email_access(receiving_user_id);
CREATE INDEX idx_email_access_grantor ON email_access(grantor_user_id);

-- Update comments on existing table
COMMENT ON TABLE encrypted_emails IS 'Stores encrypted email addresses';
COMMENT ON COLUMN encrypted_emails.email_owner_user_id IS 'The user ID of the email owner';
COMMENT ON COLUMN encrypted_emails.encrypted_email IS 'The encrypted email address (base64 encoded)';

-- Add comments on new table
COMMENT ON TABLE email_access IS 'Tracks who has access to encrypted emails';
COMMENT ON COLUMN email_access.email_owner_user_id IS 'The user ID of the email owner';
COMMENT ON COLUMN email_access.receiving_user_id IS 'The user ID of the person granted access';
COMMENT ON COLUMN email_access.grantor_user_id IS 'The user ID of the person who granted access';
COMMENT ON COLUMN email_access.encrypted_key IS 'The symmetric key (SK) encrypted for the receiving user';

COMMIT; 