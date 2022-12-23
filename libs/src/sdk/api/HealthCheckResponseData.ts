export type HealthCheckResponseData = Partial<{
  auto_upgrade_enabled: boolean
  block_difference: number
  challenge_last_event_age_sec: number
  database_connections: number
  database_is_localhost: boolean
  database_size: number
  db: {
    blockhash: string
    number: number
  }
  filesystem_size: number
  filesystem_used: number
  final_poa_block: any
  git: string
  index_eth_age_sec: number
  infra_setup: string
  last_scanned_block_for_balance_refresh: number
  last_track_unavailability_job_end_time: string
  last_track_unavailability_job_start_time: string
  latest_block_num: number
  latest_indexed_block_num: number
  maximum_healthy_block_difference: number
  meets_min_requirements: boolean
  num_users_in_immediate_balance_refresh_queue: number
  num_users_in_lazy_balance_refresh_queue: number
  number_of_cpus: number
  openresty_public_key: string
  plays: {
    is_unhealthy: boolean
    oldest_unarchived_play_created_at: string
    time_diff_general: number
    tx_info: {
      slot_diff: number
      time_diff: number
      tx_info: {
        chain_tx: {
          signature: string
          slot: number
          timestamp: number
        }
        db_tx: {
          signature: string
          slot: number
          timestamp: number
        }
      }
    }
  }
  reactions: {
    indexing_delta: number
    is_unhealthy: boolean
    reaction_delta: number
  }
  received_bytes_per_sec: number
  redis_total_memory: number
  rewards_manager: {
    is_unhealthy: number
    time_diff_general: number
    tx_info: {
      slot_diff: number
      time_diff: number
      tx_info: {
        chain_tx: {
          signature: string
          slot: number
          timestamp: number
        }
        db_tx: {
          signature: string
          slot: number
          timestamp: number
        }
      }
    }
  }
  service: string
  spl_audio_info: {
    is_unhealthy: boolean
    time_diff_general: number
    tx_info: {
      slot_diff: number
      time_diff: number
      tx_info: {
        chain_tx: {
          signature: string
          slot: number
          timestamp: number
        }
        db_tx: {
          signature: string
          slot: number
          timestamp: number
        }
      }
    }
  }
  total_memory: number
  transactions_history_backfill: {
    rewards_manager_backfilling_complete: boolean
    spl_token_backfilling_complete: boolean
    user_bank_backfilling_complete: boolean
  }
  transferred_bytes_per_sec: number
  trending_playlists_age_sec: number
  trending_tracks_age_sec: number
  url: string
  used_memory: number
  user_balances_age_sec: number
  user_bank: {
    is_unhealthy: boolean
    time_diff_general: number
    tx_info: {
      slot_diff: number
      time_diff: number
      tx_info: {
        chain_tx: {
          signature: string
          slot: number
          timestamp: number
        }
        db_tx: {
          signature: number
          slot: string
          timestamp: number
        }
      }
    }
  }
  version: string
  web: {
    blockhash: string
    blocknumber: number
  }
}>
