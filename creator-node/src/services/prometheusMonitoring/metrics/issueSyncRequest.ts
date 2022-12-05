import { snakeCase } from 'lodash'
import { Histogram } from 'prom-client'

import {
  SyncType,
  SYNC_MODES
} from '../../stateMachineManager/stateMachineConstants'
import * as config from '../../../config'
import { exponentialBucketsRange } from '../prometheusSetupUtils'

export default {
  metricType: Histogram,
  metricLabels: {
    sync_type: Object.values(SyncType as Record<string, string>).map(snakeCase),
    sync_mode: Object.values(SYNC_MODES as Record<string, string>).map(
      snakeCase
    ),
    result: [
      'success',
      'success_mode_disabled',
      'success_secondary_caught_up',
      'success_secondary_partially_caught_up',
      'success_orphan_wiped', // Deprecated
      'failure_polling_timed_out',
      'abort_sync_correctness',
      'abort_current_node_is_not_user_primary',
      'abort_input_node_is_not_user_secondary',
      'abort_user_does_not_exist_on_node',
      'abort_multiple_users_returned_from_export',
      'abort_missing_user_export_key_fields',
      'abort_mismatched_export_wallet',
      'failure_fetching_user_replica_set',
      'failure_content_node_endpoint_not_initialized',
      'failure_audius_libs_not_initialized',
      'failure_export_wallet',
      'failure_save_files_to_disk',
      'failure_save_entries_to_db',
      'failure_orphan_not_wiped', // Deprecated
      'failure_missing_wallet',
      'failure_secondary_failure_count_threshold_met',
      'failure_primary_sync_from_secondary',
      'failure_issue_sync_request',
      'failure_secondary_failed_to_progress',
      'success_clocks_already_match',
      'success_force_wipe',
      'abort_current_node_is_not_user_secondary',
      'abort_sync_in_progress',
      'abort_force_wipe_disabled',
      'abort_node_used_to_be_primary',
      'failure_force_resync_check',
      'failure_fetching_user_gateway',
      'failure_delete_db_data',
      'failure_delete_disk_data',
      'failure_sync_secondary_from_primary',
      'failure_db_transaction',
      'failure_import_not_consistent',
      'failure_import_not_contiguous',
      'failure_inconsistent_clock'
    ]
  },
  metricConfig: {
    help: 'Time spent to issue a sync request and wait for completion (seconds)',
    // 4 buckets in the range of 1 second to max before timing out a sync request
    buckets: exponentialBucketsRange(
      1,
      config.get('maxSyncMonitoringDurationInMs') / 1000,
      4
    ),
    aggregator: 'max'
  }
} as const
