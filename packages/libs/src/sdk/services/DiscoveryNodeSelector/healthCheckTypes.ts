import type { CommsResponse } from '../../api/chats/serverTypes'
import type { DeepPartial } from '../../utils/deepPartial'
import type { StorageNode } from '../StorageNodeSelector'

import type { DiscoveryNode } from './types'

export type FlaskFullResponse = Partial<{
  latest_chain_block: number
  latest_indexed_block: number
  latest_chain_slot_plays: number
  latest_indexed_slot_plays: number
  signature: string
  timestamp: string
  version: {
    service: string
    version: string
  }
  data: unknown
}>

export type ApiHealthResponseData =
  | FlaskFullResponse
  | CommsResponse
  | { data: unknown } // V1 non-full has no health fields

export type HealthCheckComms = Partial<{
  healthy: boolean
  errors: unknown
  websocket_error: unknown
  commit: string
  booted: string
  built: string
  wip: boolean
}>

export type HealthCheckResponseData = DeepPartial<{
  auto_upgrade_enabled: boolean
  block_difference: number
  challenge_last_event_age_sec: number
  chain_health: {
    status: string
  } | null
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
  network: {
    content_nodes: StorageNode[]
    discovery_nodes: string[]
    discovery_nodes_with_owner: DiscoveryNode[]
  }
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

export type HealthCheckThresholds = {
  /**
   * Minimum version of Discovery Node to allow for selection.
   * Can use the version on chain to ensure latest.
   * Note: Will not allow any newer major or minor versions (unless as backups), just newer patches.
   * @todo load this from disk by default
   * @default null
   */
  minVersion: string | null
  /**
   * The maximum number of slots allowed to be behind on indexing plays.
   * If unset, don't check the slot diff for plays.
   * @default undefined
   */
  maxSlotDiffPlays: number | null
  /**
   * The maximum number of blocks allowed to be behind on indexing the data layer.
   * @default 15
   */
  maxBlockDiff: number
}

export enum HealthCheckStatus {
  UNHEALTHY = 'unhealthy',
  BEHIND = 'behind',
  HEALTHY = 'healthy'
}

export type HealthCheckStatusReason = {
  health: HealthCheckStatus
  reason?: string
}
