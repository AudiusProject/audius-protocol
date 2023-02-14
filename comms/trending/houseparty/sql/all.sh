echo "`date` etl start" &\
clickhouse-client --multiquery < /sql/etl_users.sql &\
clickhouse-client --multiquery < /sql/etl_tracks.sql &\
clickhouse-client --multiquery < /sql/etl_saves.sql &\
clickhouse-client --multiquery < /sql/etl_reposts.sql &\
clickhouse-client --multiquery < /sql/etl_follows.sql &\
clickhouse-client --multiquery < /sql/etl_plays.sql &\
clickhouse-client --multiquery < /sql/etl_playlists.sql &\
wait

echo "`date` etl done"








echo "`date` agg start" &\
clickhouse-client --multiquery < /sql/agg_activity.sql &\
clickhouse-client --multiquery < /sql/agg_user.sql &\
clickhouse-client --multiquery < /sql/agg_track.sql &\
wait

echo "`date` agg done"