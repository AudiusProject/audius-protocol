DO $$
BEGIN
    -- For the 'artists' column in the 'tracks' table
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'tracks' AND column_name = 'artists' 
        AND udt_name != 'jsonb'
    ) THEN
        EXECUTE 'ALTER TABLE tracks ALTER COLUMN artists TYPE jsonb USING artists::text::jsonb;';
    END IF;
    
    -- For the 'resource_contributors' column in the 'tracks' table
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'tracks' AND column_name = 'resource_contributors' 
        AND udt_name != 'jsonb'
    ) THEN
        EXECUTE 'ALTER TABLE tracks ALTER COLUMN resource_contributors TYPE jsonb USING resource_contributors::text::jsonb;';
    END IF;

    -- For the 'indirect_resource_contributors' column in the 'tracks' table
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'tracks' AND column_name = 'indirect_resource_contributors' 
        AND udt_name != 'jsonb'
    ) THEN
        EXECUTE 'ALTER TABLE tracks ALTER COLUMN indirect_resource_contributors TYPE jsonb USING indirect_resource_contributors::text::jsonb;';
    END IF;

    -- For the 'artists' column in the 'playlists' table
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'playlists' AND column_name = 'artists' 
        AND udt_name != 'jsonb'
    ) THEN
        EXECUTE 'ALTER TABLE playlists ALTER COLUMN artists TYPE jsonb USING artists::text::jsonb;';
    END IF;
    
END $$;
