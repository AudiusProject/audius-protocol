begin;

-- Create partial index to speed up the update operation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_message_blast_id_partial 
ON chat_message (blast_id) 
WHERE blast_id IS NOT NULL;

-- Add the blast_audience column
ALTER TABLE chat_message ADD COLUMN IF NOT EXISTS blast_audience TEXT;

-- Populate the blast_audience column with the correct audience type from chat_blast table
UPDATE chat_message 
SET blast_audience = chat_blast.audience
FROM chat_blast
WHERE chat_message.blast_id = chat_blast.blast_id
AND chat_message.blast_audience IS NULL;

-- Drop the partial index as it's no longer needed
DROP INDEX IF EXISTS idx_chat_message_blast_id_partial;

commit; 
