BEGIN;
    UPDATE tracks
    SET track_cid = regexp_replace(track_cid, E'[\\n]+$', '', 'g')
    WHERE is_current is true AND track_cid like E'%\n';
COMMIT;
