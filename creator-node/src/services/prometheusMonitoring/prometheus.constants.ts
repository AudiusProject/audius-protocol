import { Gauge, Histogram, Summary } from 'prom-client'
import { snakeCase, mapValues } from 'lodash'
// eslint-disable-next-line import/no-unresolved
import { exponentialBucketsRange } from './prometheusUtils'
import {
  QUEUE_NAMES as STATE_MACHINE_JOB_NAMES,
  SyncType,
  SYNC_MODES
  // eslint-disable-next-line import/no-unresolved
} from '../stateMachineManager/stateMachineConstants'
import * as config from '../../config'

/**
 * For explanation of METRICS, and instructions on how to add a new metric, please see `prometheusMonitoring/README.md`
 */

// We add a namespace prefix to differentiate internal metrics from those exported by different exporters from the same host
export const NAMESPACE_PREFIX = 'audius_cn'

// The interval at which to poll the bull queue
export const QUEUE_INTERVAL = 1_000

/**
 * @notice Counter and Summary metric types are currently disabled, see README for details.
 */
export const METRIC_TYPES = Object.freeze({
  GAUGE: Gauge,
  HISTOGRAM: Histogram
  // COUNTER: Counter,
  // SUMMARY: Summary
})

/**
 * Types for recording a metric value.
 */
export const METRIC_RECORD_TYPE = Object.freeze({
  GAUGE_INC: 'GAUGE_INC',
  HISTOGRAM_OBSERVE: 'HISTOGRAM_OBSERVE'
})

const metricNames: Record<string, string> = {
  SYNC_QUEUE_JOBS_TOTAL_GAUGE: 'sync_queue_jobs_total',
  ISSUE_SYNC_REQUEST_DURATION_SECONDS_HISTOGRAM:
    'issue_sync_request_duration_seconds',
  FIND_SYNC_REQUEST_COUNTS_GAUGE: 'find_sync_request_counts',
  WRITE_QUORUM_DURATION_SECONDS_HISTOGRAM: 'write_quorum_duration_seconds',
  SECONDARY_SYNC_FROM_PRIMARY_DURATION_SECONDS_HISTOGRAM:
    'secondary_sync_from_primary_duration_seconds',
  JOBS_ACTIVE_TOTAL_GAUGE: 'jobs_active_total',
  JOBS_WAITING_TOTAL_GAUGE: 'jobs_waiting_total',
  JOBS_COMPLETED_TOTAL_GAUGE: 'jobs_completed_total',
  JOBS_FAILED_TOTAL_GAUGE: 'jobs_failed_total',
  JOBS_DELAYED_TOTAL_GAUGE: 'jobs_delayed_total',
  JOBS_DURATION_SECONDS_HISTOGRAM: 'jobs_duration_seconds',
  JOBS_WAITING_DURATION_SECONDS_HISTOGRAM: 'jobs_waiting_duration_seconds',
  JOBS_ATTEMPTS_HISTOGRAM: 'jobs_attempts'
}
// Add a histogram for each job in the state machine queues.
// Some have custom labels below, and all of them use the label: uncaughtError=true/false
for (const jobName of Object.values(
  STATE_MACHINE_JOB_NAMES as Record<string, string>
)) {
  metricNames[
    `STATE_MACHINE_${jobName}_JOB_DURATION_SECONDS_HISTOGRAM`
  ] = `state_machine_${snakeCase(jobName)}_job_duration_seconds`
}
export const METRIC_NAMES = Object.freeze(
  mapValues(metricNames, (metricName) => `${NAMESPACE_PREFIX}_${metricName}`)
)

export const METRIC_LABELS = Object.freeze({
  [METRIC_NAMES.SECONDARY_SYNC_FROM_PRIMARY_DURATION_SECONDS_HISTOGRAM]: {
    mode: ['force_resync', 'default'],
    result: [
      'success',
      'failure_force_resync_check',
      'failure_sync_secondary_from_primary',
      'failure_malformed_export',
      'failure_db_transaction',
      'failure_sync_in_progress',
      'failure_export_wallet',
      'failure_skip_threshold_not_reached',
      'failure_import_not_consistent',
      'failure_import_not_contiguous',
      'failure_inconsistent_clock'
    ],
    // 5 buckets in the range of 1 second to max seconds before timing out write quorum
    buckets: exponentialBucketsRange(0.1, 60, 10)
  },
  [METRIC_NAMES.ISSUE_SYNC_REQUEST_DURATION_SECONDS_HISTOGRAM]: {
    sync_type: Object.values(SyncType as Record<string, string>).map(snakeCase),
    sync_mode: Object.values(SYNC_MODES as Record<string, string>).map(
      snakeCase
    ),
    result: [
      'success',
      'success_mode_disabled',
      'success_secondary_caught_up',
      'success_secondary_partially_caught_up',
      'failure_missing_wallet',
      'failure_secondary_failure_count_threshold_met',
      'failure_primary_sync_from_secondary',
      'failure_issue_sync_request',
      'failure_secondary_failed_to_progress'
    ]
  },

  [METRIC_NAMES[
    `STATE_MACHINE_${STATE_MACHINE_JOB_NAMES.UPDATE_REPLICA_SET}_JOB_DURATION_SECONDS_HISTOGRAM`
  ]]: {
    // Whether or not the user's replica set was updated during this job
    issuedReconfig: ['false', 'true'],
    // The type of reconfig, if any, that happened during this job (or that would happen if reconfigs were enabled)
    reconfigType: [
      'one_secondary', // Only one secondary was replaced in the user's replica set
      'multiple_secondaries', // Both secondaries were replaced in the user's replica set
      'primary_and_or_secondaries', // A secondary gets promoted to new primary and one or both secondaries get replaced with new random nodes
      'null' // No change was made to the user's replica set because the job short-circuited before selecting or was unable to select new node(s)
    ]
  },

  [METRIC_NAMES.FIND_SYNC_REQUEST_COUNTS_GAUGE]: {
    sync_mode: Object.values(SYNC_MODES as Record<string, string>).map(
      snakeCase
    ),
    result: [
      'not_checked', // Default value -- means the logic short-circuited before checking if the primary should sync to the secondary. This can be expected if this node wasn't the user's primary
      'no_sync_already_marked_unhealthy', // Sync not found because the secondary was marked unhealthy before being passed to the find-sync-requests job
      'no_sync_sp_id_mismatch', // Sync not found because the secondary's spID mismatched what the chain reported
      'no_sync_success_rate_too_low', // Sync not found because the success rate of syncing to this secondary is below the acceptable threshold
      'no_sync_error_computing_sync_mode', // Sync not found because of failure to compute sync mode
      'no_sync_secondary_data_matches_primary', // Sync not found because the secondary's clock value and filesHash match primary's
      'no_sync_unexpected_error', // Sync not found because some uncaught error was thrown
      'new_sync_request_enqueued', // Sync found because all other conditions were met
      'sync_request_already_enqueued', // Sync was found but a duplicate request has already been enqueued so no need to enqueue another
      'new_sync_request_unable_to_enqueue' // Sync was found but something prevented a new request from being created
    ]
  },

  [METRIC_NAMES.WRITE_QUORUM_DURATION_SECONDS_HISTOGRAM]: {
    // Whether or not write quorum is enabled/enforced
    enforceWriteQuorum: ['false', 'true'],
    // Whether or not write quorum is ignored for this specific route (even if it's enabled in general).
    // If it's ignored, it will still attempt replication but not fail the request if replication fails
    ignoreWriteQuorum: ['false', 'true'],
    // The route that triggered write quorum
    route: [
      // Routes that use write quorum but don't enforce it (ignoreWriteQuorum should be true):
      '/image_upload',
      '/audius_users',
      '/playlists',
      '/tracks',
      // Routes that strictly enforce write quorum (ignoreWriteQuorum should be false)
      '/audius_users/metadata',
      '/playlists/metadata',
      '/tracks/metadata'
    ],
    result: [
      'succeeded', // Data was replicated to one or more secondaries
      'failed_short_circuit', // Failed before attempting to sync because some basic condition wasn't met (node not primary, missing wallet, or manual syncs disabled)
      'failed_uncaught_error', // Failed due to some uncaught exception. This should never happen
      'failed_sync' // Failed to reach 2/3 quorum because no syncs were successful
    ]
  }
})

const METRIC_LABEL_NAMES = Object.freeze(
  Object.fromEntries(
    Object.entries(METRIC_LABELS).map(([metric, metricLabels]) => [
      metric,
      Object.keys(metricLabels)
    ])
  )
)

type Metric = {
  metricType: any
  metricConfig: {
    name: string
    help: string
    labelNames: string[]
  }
}

export const METRICS: Record<string, Metric> = Object.freeze({
  [METRIC_NAMES.JOBS_COMPLETED_TOTAL_GAUGE]: {
    metricType: METRIC_TYPES.GAUGE,
    metricConfig: {
      name: METRIC_NAMES.JOBS_COMPLETED_TOTAL_GAUGE,
      help: 'Number of completed jobs',
      labelNames: ['queue_name', 'job_name']
    }
  },
  [METRIC_NAMES.JOBS_FAILED_TOTAL_GAUGE]: {
    metricType: METRIC_TYPES.GAUGE,
    metricConfig: {
      name: METRIC_NAMES.JOBS_FAILED_TOTAL_GAUGE,
      help: 'Number of failed jobs',
      labelNames: ['queue_name', 'job_name']
    }
  },
  [METRIC_NAMES.JOBS_DELAYED_TOTAL_GAUGE]: {
    metricType: METRIC_TYPES.GAUGE,
    metricConfig: {
      name: METRIC_NAMES.JOBS_DELAYED_TOTAL_GAUGE,
      help: 'Number of delayed jobs',
      labelNames: ['queue_name', 'job_name']
    }
  },
  [METRIC_NAMES.JOBS_ACTIVE_TOTAL_GAUGE]: {
    metricType: METRIC_TYPES.GAUGE,
    metricConfig: {
      name: METRIC_NAMES.JOBS_ACTIVE_TOTAL_GAUGE,
      help: 'Number of active jobs',
      labelNames: ['queue_name', 'job_name']
    }
  },
  [METRIC_NAMES.JOBS_WAITING_TOTAL_GAUGE]: {
    metricType: METRIC_TYPES.GAUGE,
    metricConfig: {
      name: METRIC_NAMES.JOBS_WAITING_TOTAL_GAUGE,
      help: 'Number of waiting jobs',
      labelNames: ['queue_name', 'job_name']
    }
  },
  [METRIC_NAMES.JOBS_DURATION_SECONDS_HISTOGRAM]: {
    metricType: METRIC_TYPES.HISTOGRAM,
    metricConfig: {
      name: METRIC_NAMES.JOBS_DURATION_SECONDS_HISTOGRAM,
      help: 'Time to complete jobs',
      labelNames: ['queue_name', 'job_name', 'status'],
      // 10 buckets in the range of 1 seconds to max to 10 minutes
      buckets: exponentialBucketsRange(1, 600, 10)
    }
  },
  [METRIC_NAMES.JOBS_WAITING_DURATION_SECONDS_HISTROGRAM]: {
    metricType: METRIC_TYPES.HISTOGRAM,
    metricConfig: {
      name: METRIC_NAMES.JOBS_WAITING_DURATION_SECONDS_HISTOGRAM,
      help: 'Time spent waiting for jobs to run',
      labelNames: ['queue_name', 'job_name', 'status'],
      // 10 buckets in the range of 1 seconds to max to 10 minutes
      buckets: exponentialBucketsRange(1, 600, 10)
    }
  },
  [METRIC_NAMES.JOBS_ATTEMPTS_HISTOGRAM]: {
    metricType: METRIC_TYPES.HISTOGRAM,
    metricConfig: {
      name: METRIC_NAMES.JOBS_ATTEMPTS_HISTOGRAM,
      help: 'Job attempts made',
      labelNames: ['queue_name', 'job_name', 'status'],
      // 10 buckets in the range of 1 seconds to max to 10 minutes
      buckets: exponentialBucketsRange(1, 600, 10)
    }
  },
  [METRIC_NAMES.SECONDARY_SYNC_FROM_PRIMARY_DURATION_SECONDS_HISTOGRAM]: {
    metricType: METRIC_TYPES.HISTOGRAM,
    metricConfig: {
      name: METRIC_NAMES.SECONDARY_SYNC_FROM_PRIMARY_DURATION_SECONDS_HISTOGRAM,
      help: 'Time spent to sync a secondary from a primary (seconds)',
      labelNames:
        METRIC_LABEL_NAMES[
          METRIC_NAMES.SECONDARY_SYNC_FROM_PRIMARY_DURATION_SECONDS_HISTOGRAM
        ]
    }
  },
  [METRIC_NAMES.SYNC_QUEUE_JOBS_TOTAL_GAUGE]: {
    metricType: METRIC_TYPES.GAUGE,
    metricConfig: {
      name: METRIC_NAMES.SYNC_QUEUE_JOBS_TOTAL_GAUGE,
      help: 'Current job counts for SyncQueue by status',
      labelNames: ['status']
    }
  },

  [METRIC_NAMES.ISSUE_SYNC_REQUEST_DURATION_SECONDS_HISTOGRAM]: {
    metricType: METRIC_TYPES.HISTOGRAM,
    metricConfig: {
      name: METRIC_NAMES.ISSUE_SYNC_REQUEST_DURATION_SECONDS_HISTOGRAM,
      help: 'Time spent to issue a sync request and wait for completion (seconds)',
      labelNames:
        METRIC_LABEL_NAMES[
          METRIC_NAMES.ISSUE_SYNC_REQUEST_DURATION_SECONDS_HISTOGRAM
        ],
      // 4 buckets in the range of 1 second to max before timing out a sync request
      buckets: exponentialBucketsRange(
        1,
        config.get('maxSyncMonitoringDurationInMs') / 1000,
        4
      )
    }
  },

  // Add histogram for each job in the state machine queues
  ...Object.fromEntries(
    Object.values(STATE_MACHINE_JOB_NAMES).map((jobName) => [
      METRIC_NAMES[`STATE_MACHINE_${jobName}_JOB_DURATION_SECONDS_HISTOGRAM`],
      {
        metricType: METRIC_TYPES.HISTOGRAM,
        metricConfig: {
          name: METRIC_NAMES[
            `STATE_MACHINE_${jobName}_JOB_DURATION_SECONDS_HISTOGRAM`
          ],
          help: `Duration in seconds for a ${jobName} job to complete`,
          labelNames: [
            // Whether the job completed (including with a caught error) or quit unexpectedly
            'uncaughtError',
            // Label names, if any, that are specific to this job type
            ...(METRIC_LABEL_NAMES[
              METRIC_NAMES[
                `STATE_MACHINE_${jobName}_JOB_DURATION_SECONDS_HISTOGRAM`
              ]
            ] || [])
          ],
          buckets: [1, 5, 10, 30, 60, 120] // 1 second to 2 minutes
        }
      }
    ])
  ),
  [METRIC_NAMES.FIND_SYNC_REQUEST_COUNTS_GAUGE]: {
    metricType: METRIC_TYPES.GAUGE,
    metricConfig: {
      name: METRIC_NAMES.FIND_SYNC_REQUEST_COUNTS_GAUGE,
      help: "Counts for each find-sync-requests job's result when looking for syncs that should be requested from a primary to a secondary",
      labelNames:
        METRIC_LABEL_NAMES[METRIC_NAMES.FIND_SYNC_REQUEST_COUNTS_GAUGE]
    }
  },
  [METRIC_NAMES.WRITE_QUORUM_DURATION_SECONDS_HISTOGRAM]: {
    metricType: METRIC_TYPES.HISTOGRAM,
    metricConfig: {
      name: METRIC_NAMES.WRITE_QUORUM_DURATION_SECONDS_HISTOGRAM,
      help: 'Seconds spent attempting to replicate data to a secondary node for write quorum',
      labelNames:
        METRIC_LABEL_NAMES[
          METRIC_NAMES.WRITE_QUORUM_DURATION_SECONDS_HISTOGRAM
        ],
      // 5 buckets in the range of 1 second to max seconds before timing out write quorum
      buckets: exponentialBucketsRange(
        1,
        config.get('issueAndWaitForSecondarySyncRequestsPollingDurationMs') /
          1000,
        5
      )
    }
  }
})

module.exports = {
  NAMESPACE_PREFIX,
  METRIC_TYPES,
  METRIC_NAMES,
  METRIC_LABELS,
  METRIC_RECORD_TYPE,
  METRICS,
  QUEUE_INTERVAL
}
