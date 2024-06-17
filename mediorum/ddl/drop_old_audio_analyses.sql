begin;

DO $$ 
BEGIN
    UPDATE uploads
    SET 
        audio_analysis_status = NULL,
        audio_analysis_error = NULL,
        audio_analyzed_by = NULL,
        audio_analyzed_at = NULL,
        audio_analysis_results = NULL
    WHERE created_at <= '2024-06-18 07:00:00'::timestamp AND audio_analysis_status IS NOT NULL AND audio_analysis_status != '';
END $$;

commit;
