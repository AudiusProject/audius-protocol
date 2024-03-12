latest_block_redis_key = "latest_block_from_chain"
latest_block_hash_redis_key = "latest_blockhash_from_chain"
most_recent_indexed_block_redis_key = "most_recently_indexed_block_from_db"
most_recent_indexed_block_hash_redis_key = "most_recently_indexed_block_hash_from_db"
final_poa_block_redis_key = "final_poa_block"

most_recent_indexed_aggregate_user_block_redis_key = (
    "most_recent_indexed_aggregate_user_block"
)
index_aggregate_user_last_refresh_completion_redis_key = (
    "index_aggregate_user:last-refresh-completion"
)

trending_tracks_last_completion_redis_key = "trending:tracks:last-completion"
trending_playlists_last_completion_redis_key = "trending-playlists:last-completion"
challenges_last_processed_event_redis_key = "challenges:last-processed-event"
user_balances_refresh_last_completion_redis_key = "user_balances:last-completion"
latest_legacy_play_db_key = "latest_legacy_play_db_key"
oldest_unarchived_play_key = "oldest_unarchived_play_key"

index_eth_last_completion_redis_key = "index_eth:last-completion"

# Solana latest program keys
latest_sol_play_program_tx_key = "latest_sol_program_tx:play:chain"
latest_sol_play_db_tx_key = "latest_sol_program_tx:play:db"

latest_sol_rewards_manager_program_tx_key = (
    "latest_sol_program_tx:rewards_manager:chain"
)
latest_sol_rewards_manager_db_tx_key = "latest_sol_program_tx:rewards_manager:db"

latest_sol_user_bank_program_tx_key = "latest_sol_program_tx:user_bank:chain"
latest_sol_user_bank_db_tx_key = "latest_sol_program_tx:user_bank:db"

latest_sol_payment_router_program_tx_key = "latest_sol_program_tx:payment_router:chain"
latest_sol_payment_router_db_tx_key = "latest_sol_program_tx:payment_router:db"

latest_sol_spl_token_program_tx_key = "latest_sol_program_tx:spl_token:chain"
latest_sol_spl_token_db_key = "latest_sol_program_tx:spl_token:db"

# Solana latest slot per indexer
# Used to get the latest processed slot of each indexing task, using the global slots instead of the per-program slots
latest_sol_user_bank_slot_key = "latest_sol_slot:user_bank"
latest_sol_payment_router_slot_key = "latest_sol_slot:payment_router"
latest_sol_aggregate_tips_slot_key = "latest_sol_slot:aggregate_tips"
latest_sol_plays_slot_key = "latest_sol_slot:plays"
latest_sol_rewards_manager_slot_key = "latest_sol_slot:rewards_manager"

# Reactions
LAST_REACTIONS_INDEX_TIME_KEY = "reactions_last_index_time"
LAST_SEEN_NEW_REACTION_TIME_KEY = "reactions_last_new_reaction_time"

# Delist status cursor monitoring keys
USER_DELIST_STATUS_CURSOR_CHECK_TIMESTAMP_KEY = (
    "user_delist_status_cursor_check_timestamp_key"
)
USER_DELIST_STATUS_CURSOR_CHECK_KEY = "user_delist_status_cursor_check_key"
TRACK_DELIST_STATUS_CURSOR_CHECK_TIMESTAMP_KEY = (
    "track_delist_status_cursor_check_timestamp_key"
)
TRACK_DELIST_STATUS_CURSOR_CHECK_KEY = "track_delist_status_cursor_check_key"

# User delist discrepancy keys
USER_DELIST_DISCREPANCIES_TIMESTAMP_KEY = "user_delist_discrepancies_timestamp"
USER_DELIST_DISCREPANCIES_KEY = "user_delist_discrepancies"

# Track delist discrepancy keys
TRACK_DELIST_DISCREPANCIES_TIMESTAMP_KEY = "track_delist_discrepancies_timestamp"
TRACK_DELIST_DISCREPANCIES_KEY = "track_delist_discrepancies"
