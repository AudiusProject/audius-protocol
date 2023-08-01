update "cid_data"
set "data" = trim('"' FROM (regexp_replace(data::text, '\\', '', 'g')))::json->'data'
where "data"::text LIKE '"%"';