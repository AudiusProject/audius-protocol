CREATE OR REPLACE FUNCTION find_track(url text)
RETURNS TABLE (user_id integer, track_id integer)
AS $$
DECLARE
    segments text[];
    v_handle text;
    v_slug text;
BEGIN
    -- Split the URL into path segments
    segments := string_to_array(regexp_replace(url, '^.+://[^/]+', ''), '/');

    -- Remove empty segments
    segments := segments[array_length(segments, 1) - array_upper(segments, 1) + 1:];

    -- Retrieve the last two segments
    v_slug := segments[array_upper(segments, 1)];
    v_handle := segments[array_upper(segments, 1) - 1];

    select u.user_id into user_id from users u where handle_lc = lower(v_handle);

    select r.track_id
    into track_id
    from track_routes r
    where r.slug = v_slug
      and owner_id = user_id
    order by is_current desc
    limit 1;

    return next;
END;
$$ LANGUAGE plpgsql;
