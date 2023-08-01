BEGIN;
  DO $$ BEGIN
  IF table_has_column('tracks', 'length') THEN
      ALTER TABLE "tracks" DISABLE trigger on_track;
      ALTER TABLE "tracks" DISABLE trigger trg_tracks;

      -- Update duration if only the duration of a target track is empty
      UPDATE "tracks"
      SET "duration" = "sub"."duration"
      FROM (
        SELECT
          "track_id",
          SUM(cast("segments"->>'duration' AS FLOAT)) AS duration
        FROM
          (
            SELECT jsonb_array_elements("track_segments") AS segments, "track_id"
            FROM "tracks"
            WHERE
              "is_current" = TRUE
              and "duration" = 0
              and jsonb_array_length("track_segments") != 0
          ) a
        GROUP BY
          "track_id"
      ) AS sub
      WHERE "tracks"."track_id" = "sub"."track_id";

      -- Drop length column (no longer relevant)
      ALTER TABLE "tracks"
      DROP COLUMN "length";

      ALTER TABLE "tracks" ENABLE trigger on_track;
      ALTER TABLE "tracks" ENABLE trigger trg_tracks;

  END IF;
  END $$;
COMMIT;
