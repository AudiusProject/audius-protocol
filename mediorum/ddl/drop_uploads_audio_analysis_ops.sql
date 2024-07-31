begin;
    delete from ops where "table" = 'uploads' and action = 'update' and exists (
        select 1
        from jsonb_array_elements(data) as elem
        where elem->>'audio_analysis_status' = 'timeout'
        and elem->'selected_preview' = '{"Valid": false, "String": ""}'
    );
commit;
