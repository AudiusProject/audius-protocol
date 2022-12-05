import { snakeCase } from 'lodash'
import { Gauge } from 'prom-client'

import { SYNC_MODES } from '../../stateMachineManager/stateMachineConstants'

export default {
  metricType: Gauge,
  metricLabels: {
    sync_mode: Object.values(SYNC_MODES as Record<string, string>).map(
      snakeCase
    ),
    result: [
      'not_checked', // Default value -- means the logic short-circuited before checking if the primary should sync to the secondary. This can be expected if this node wasn't the user's primary
      'no_sync_already_marked_unhealthy', // Sync not found because the secondary was marked unhealthy before being passed to the find-sync-requests job
      'no_sync_sp_id_mismatch', // Sync not found because the secondary's spID mismatched what the chain reported
      'no_sync_max_errors_encountered', // Sync not found because the success rate of syncing to this secondary is below the acceptable threshold
      'no_sync_error_computing_sync_mode', // Sync not found because of failure to compute sync mode
      'no_sync_secondary_data_matches_primary', // Sync not found because the secondary's clock value and filesHash match primary's
      'no_sync_unexpected_error', // Sync not found because some uncaught error was thrown
      'new_sync_request_enqueued', // Sync found because all other conditions were met
      'sync_request_already_enqueued', // Sync was found but a duplicate request has already been enqueued so no need to enqueue another
      'new_sync_request_unable_to_enqueue' // Sync was found but something prevented a new request from being created
    ]
  },
  metricConfig: {
    help: "Counts for each find-sync-requests job's result when looking for syncs that should be requested from a primary to a secondary",
    aggregator: 'max'
  }
} as const
