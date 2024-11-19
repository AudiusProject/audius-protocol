begin;

-- Store encrypted emails with their metadata
CREATE TABLE IF NOT EXISTS encrypted_emails (
    email_id INTEGER PRIMARY KEY,
    seller_user_id INTEGER NOT NULL,
    encrypted_email TEXT NOT NULL  -- base64 encoded
);

COMMENT ON TABLE encrypted_emails IS 'Stores encrypted emails and their metadata for secure communication between sellers and buyers';
COMMENT ON COLUMN encrypted_emails.email_id IS 'Unique identifier for each encrypted email record';
COMMENT ON COLUMN encrypted_emails.seller_user_id IS 'User ID of the seller who owns the encrypted email';
COMMENT ON COLUMN encrypted_emails.encrypted_email IS 'Base64 encoded encrypted email content';

-- Store the encryption keys for sellers and grantees
CREATE TABLE IF NOT EXISTS email_encryption_keys (
    key_id INTEGER PRIMARY KEY,
    seller_user_id INTEGER NOT NULL,
    owner_key TEXT NOT NULL,  -- base64 encoded
    UNIQUE(seller_user_id)  -- one owner key per seller
);

COMMENT ON TABLE email_encryption_keys IS 'Stores encryption keys for sellers to manage their encrypted emails';
COMMENT ON COLUMN email_encryption_keys.key_id IS 'Unique identifier for each encryption key record';
COMMENT ON COLUMN email_encryption_keys.seller_user_id IS 'User ID of the seller who owns the encryption key';
COMMENT ON COLUMN email_encryption_keys.owner_key IS 'Base64 encoded encryption key owned by the seller';

-- Store the encrypted keys for grantees
CREATE TABLE IF NOT EXISTS email_grantee_keys (
    grantee_key_id INTEGER PRIMARY KEY,
    seller_user_id INTEGER NOT NULL,
    grantee_user_id INTEGER NOT NULL,
    encrypted_key TEXT NOT NULL,  -- base64 encoded
    UNIQUE(seller_user_id, grantee_user_id)  -- one key per seller-grantee pair
);

COMMENT ON TABLE email_grantee_keys IS 'Stores encrypted keys for grantees who have been given access to decrypt emails';
COMMENT ON COLUMN email_grantee_keys.grantee_key_id IS 'Unique identifier for each grantee key record';
COMMENT ON COLUMN email_grantee_keys.seller_user_id IS 'User ID of the seller who granted access';
COMMENT ON COLUMN email_grantee_keys.grantee_user_id IS 'User ID of the grantee who received access';
COMMENT ON COLUMN email_grantee_keys.encrypted_key IS 'Base64 encoded encryption key encrypted for the grantee';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_encrypted_emails_seller ON encrypted_emails(seller_user_id);
CREATE INDEX IF NOT EXISTS idx_email_grantee_keys_seller_grantee ON email_grantee_keys(seller_user_id, grantee_user_id);

end;
