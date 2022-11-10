// See prometheus.constants.js for reference on potential errors
export const SYNC_ERRORS_TO_MAX_NUMBER_OF_RETRIES = Object.freeze({
  failure_fetching_user_replica_set: 10,
  failure_force_resync_check: 10,
  failure_fetching_user_gateway: 10,
  failure_delete_db_data: 10,
  failure_delete_disk_data: 10,
  failure_sync_secondary_from_primary: 10,
  failure_db_transaction: 10,
  failure_export_wallet: 10,
  failure_import_not_consistent: 10,
  failure_import_not_contiguous: 10,
  failure_inconsistent_clock: 10,
  default: 5
})
// Map<string, number>

export const SYNC_ERRORS_TO_MAX_NUMBER_OF_RETRIES_MAP: Map<string, number> =
  new Map(Object.entries(SYNC_ERRORS_TO_MAX_NUMBER_OF_RETRIES))

export const SYNC_ERRORS = [
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
  'default'
]

export const MAX_SCAN_ATTEMPTS = 10
