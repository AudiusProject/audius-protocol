// See prometheus.constants.js for reference on potential errors
export const SYNC_ERRORS_TO_MAX_NUMBER_OF_RETRIES = Object.freeze({
  failure_fetching_user_replica_set: 10,
  failure_force_resync_check: 10,
  failure_fetching_user_gateway: 10,
  failure_delete_db_data: 3,
  failure_delete_disk_data: 3,
  failure_sync_secondary_from_primary: 10,
  failure_db_transaction: 3,
  failure_export_wallet: 10,
  failure_import_not_consistent: 3,
  failure_import_not_contiguous: 3,
  failure_inconsistent_clock: 10,
  failure_undefined_sync_status: 3,
  default: 5
})

export const SYNC_ERRORS_TO_MAX_NUMBER_OF_RETRIES_MAP: Map<string, number> =
  new Map(Object.entries(SYNC_ERRORS_TO_MAX_NUMBER_OF_RETRIES))
