import { Histogram } from 'prom-client'

import { exponentialBucketsRange } from '../prometheusSetupUtils'

export const RESULT_LABEL_VALUES = [
  'success',
  'success_clocks_already_match',
  'success_force_wipe',
  'abort_user_does_not_exist_on_node',
  'abort_multiple_users_returned_from_export',
  'abort_missing_user_export_key_fields',
  'abort_mismatched_export_wallet',
  'abort_current_node_is_not_user_primary',
  'abort_current_node_is_not_user_secondary',
  'abort_sync_in_progress',
  'abort_force_wipe_disabled',
  'abort_node_used_to_be_primary',
  'failure_fetching_user_replica_set',
  'failure_force_resync_check',
  'failure_fetching_user_gateway',
  'failure_delete_db_data',
  'failure_delete_disk_data',
  'failure_sync_secondary_from_primary',
  'failure_db_transaction',
  'failure_export_wallet',
  'failure_import_not_consistent',
  'failure_import_not_contiguous',
  'failure_inconsistent_clock',
  'failure_undefined_sync_status'
]
export default {
  metricType: Histogram,
  metricLabels: {
    mode: ['force_resync', 'default', 'force_wipe'],
    result: RESULT_LABEL_VALUES as readonly string[]
  },
  metricConfig: {
    help: 'Time spent to sync a secondary from a primary (seconds)',
    aggregator: 'average',
    // 5 buckets in the range of 1 second to max seconds before timing out write quorum
    buckets: exponentialBucketsRange(0.1, 60, 10)
  }
} as const
