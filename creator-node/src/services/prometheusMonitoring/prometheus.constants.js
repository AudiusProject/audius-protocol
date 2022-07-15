const promClient = require('prom-client')
const _ = require('lodash')
const config = require('../../config')
const { exponentialBucketsRange } = require('./prometheusUtils')
const {
  JOB_NAMES: STATE_MACHINE_JOB_NAMES,
  SyncType,
  SYNC_MODES
} = require('../stateMachineManager/stateMachineConstants')

/**
 * For explanation of Metrics, and instructions on how to add a new metric, please see `prometheusMonitoring/README.md`
 */

// We add a namespace prefix to differentiate internal metrics from those exported by different exporters from the same host
const NamespacePrefix = 'audius_cn_'

/**
 * @notice Counter and Summary metric types are currently disabled, see README for details.
 */
const MetricTypes = Object.freeze({
  GAUGE: promClient.Gauge,
  HISTOGRAM: promClient.Histogram
  // COUNTER: promClient.Counter,
  // SUMMARY: promClient.Summary
})

/**
 * Types for recording a metric value.
 */
const MetricRecordType = Object.freeze({
  GAUGE_INC: 'GAUGE_INC',
  HISTOGRAM_OBSERVE: 'HISTOGRAM_OBSERVE'
})

let MetricNames = {
  SYNC_QUEUE_JOBS_TOTAL_GAUGE: 'sync_queue_jobs_total',
  ROUTE_POST_TRACKS_DURATION_SECONDS_HISTOGRAM:
    'route_post_tracks_duration_seconds',
  ISSUE_SYNC_REQUEST_DURATION_SECONDS_HISTOGRAM:
    'issue_sync_request_duration_seconds',
  FIND_SYNC_REQUEST_COUNTS_GAUGE: 'find_sync_request_counts',
  WRITE_QUORUM_DURATION_SECONDS_HISTOGRAM: 'write_quorum_duration_seconds'
}
// Add a histogram for each job in the state machine queues.
// Some have custom labels below, and all of them use the label: uncaughtError=true/false
for (const jobName of Object.values(STATE_MACHINE_JOB_NAMES)) {
  MetricNames[
    `STATE_MACHINE_${jobName}_JOB_DURATION_SECONDS_HISTOGRAM`
  ] = `state_machine_${_.snakeCase(jobName)}_job_duration_seconds`
}
MetricNames = Object.freeze(
  _.mapValues(MetricNames, (metricName) => NamespacePrefix + metricName)
)

const MetricLabels = Object.freeze({
  [MetricNames.ISSUE_SYNC_REQUEST_DURATION_SECONDS_HISTOGRAM]: {
    sync_type: Object.values(SyncType).map(_.snakeCase),
    sync_mode: Object.values(SYNC_MODES).map(_.snakeCase),
    result: [
      'failure_validate_job_data',
      'success',
      'failure_secondary_failure_count_threshold_met',
      'success_mode_disabled',
      'failure_primary_sync_from_secondary',
      'failure_issue_sync_request',
      'success_secondary_caught_up',
      'success_secondary_partially_caught_up',
      'failure_secondary_failed_to_progress'
    ]
  },

  [MetricNames[
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

  [MetricNames.FIND_SYNC_REQUEST_COUNTS_GAUGE]: {
    sync_mode: Object.values(SYNC_MODES).map(_.snakeCase),
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

  [MetricNames.WRITE_QUORUM_DURATION_SECONDS_HISTOGRAM]: {
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

const MetricLabelNames = Object.freeze(
  Object.fromEntries(
    Object.entries(MetricLabels).map(([metric, metricLabels]) => [
      metric,
      Object.keys(metricLabels)
    ])
  )
)

const Metrics = Object.freeze({
  [MetricNames.SYNC_QUEUE_JOBS_TOTAL_GAUGE]: {
    metricType: MetricTypes.GAUGE,
    metricConfig: {
      name: MetricNames.SYNC_QUEUE_JOBS_TOTAL_GAUGE,
      help: 'Current job counts for SyncQueue by status',
      labelNames: ['status']
    }
  },

  /** @notice This metric will eventually be replaced by an express route metrics middleware */
  [MetricNames.ROUTE_POST_TRACKS_DURATION_SECONDS_HISTOGRAM]: {
    metricType: MetricTypes.HISTOGRAM,
    metricConfig: {
      name: MetricNames.ROUTE_POST_TRACKS_DURATION_SECONDS_HISTOGRAM,
      help: 'Duration for POST /tracks route',
      labelNames: ['code'],
      buckets: [0.1, 0.3, 0.5, 1, 3, 5, 10] // 0.1 to 10 seconds
    }
  },

  [MetricNames.ISSUE_SYNC_REQUEST_DURATION_SECONDS_HISTOGRAM]: {
    metricType: MetricTypes.HISTOGRAM,
    metricConfig: {
      name: MetricNames.ISSUE_SYNC_REQUEST_DURATION_SECONDS_HISTOGRAM,
      help: 'Time spent to issue a sync request and wait for completion (seconds)',
      labelNames:
        MetricLabelNames[
          MetricNames.ISSUE_SYNC_REQUEST_DURATION_SECONDS_HISTOGRAM
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
      MetricNames[`STATE_MACHINE_${jobName}_JOB_DURATION_SECONDS_HISTOGRAM`],
      {
        metricType: MetricTypes.HISTOGRAM,
        metricConfig: {
          name: MetricNames[
            `STATE_MACHINE_${jobName}_JOB_DURATION_SECONDS_HISTOGRAM`
          ],
          help: `Duration in seconds for a ${jobName} job to complete`,
          labelNames: [
            // Whether the job completed (including with a caught error) or quit unexpectedly
            'uncaughtError',
            // Label names, if any, that are specific to this job type
            ...(MetricLabelNames[
              MetricNames[
                `STATE_MACHINE_${jobName}_JOB_DURATION_SECONDS_HISTOGRAM`
              ]
            ] || [])
          ],
          buckets: [1, 5, 10, 30, 60, 120] // 1 second to 2 minutes
        }
      }
    ])
  ),

  [MetricNames.FIND_SYNC_REQUEST_COUNTS_GAUGE]: {
    metricType: MetricTypes.GAUGE,
    metricConfig: {
      name: MetricNames.FIND_SYNC_REQUEST_COUNTS_GAUGE,
      help: "Counts for each find-sync-requests job's result when looking for syncs that should be requested from a primary to a secondary",
      labelNames: MetricLabelNames[MetricNames.FIND_SYNC_REQUEST_COUNTS_GAUGE]
    }
  },

  [MetricNames.WRITE_QUORUM_DURATION_SECONDS_HISTOGRAM]: {
    metricType: MetricTypes.HISTOGRAM,
    metricConfig: {
      name: MetricNames.WRITE_QUORUM_DURATION_SECONDS_HISTOGRAM,
      help: 'Seconds spent attempting to replicate data to a secondary node for write quorum',
      labelNames:
        MetricLabelNames[MetricNames.WRITE_QUORUM_DURATION_SECONDS_HISTOGRAM],
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

module.exports.NamespacePrefix = NamespacePrefix
module.exports.MetricTypes = MetricTypes
module.exports.MetricNames = MetricNames
module.exports.MetricLabels = MetricLabels
module.exports.MetricRecordType = MetricRecordType
module.exports.Metrics = Metrics
