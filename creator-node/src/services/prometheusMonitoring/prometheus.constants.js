const promClient = require('prom-client')
const _ = require('lodash')
const config = require('../../config')
const { exponentialBucketsRange } = require('./prometheusUtils')
const {
  JOB_NAMES: STATE_MACHINE_JOB_NAMES,
  SyncType
} = require('../stateMachineManager/stateMachineConstants')

/**
 * For explanation of Metrics, and instructions on how to add a new metric, please see `prometheusMonitoring/README.md`
 */

// We add a namespace prefix to differentiate internal metrics from those exported by different exporters from the same host
const NAMESPACE_PREFIX = 'audius_cn'

/**
 * @notice Counter and Summary metric types are currently disabled, see README for details.
 */
const METRIC_TYPES = Object.freeze({
  GAUGE: promClient.Gauge,
  HISTOGRAM: promClient.Histogram
  // COUNTER: promClient.Counter,
  // SUMMARY: promClient.Summary
})

/**
 * Types for recording a metric value.
 */
const METRIC_RECORD_TYPE = Object.freeze({
  GAUGE_INC: 'GAUGE_INC',
  HISTOGRAM_OBSERVE: 'HISTOGRAM_OBSERVE'
})

const metricNames = {
  SYNC_QUEUE_JOBS_TOTAL_GAUGE: 'sync_queue_jobs_total',
  ROUTE_POST_TRACKS_DURATION_SECONDS_HISTOGRAM:
    'route_post_tracks_duration_seconds',
  ISSUE_SYNC_REQUEST_MONITORING_DURATION_SECONDS_HISTOGRAM:
    'issue_sync_request_monitoring_duration_seconds',
  FIND_SYNC_REQUEST_COUNTS_GAUGE: 'find_sync_request_counts'
}
// Add a histogram for each job in the state machine queues.
// Some have custom labels below, and all of them use the label: uncaughtError=true/false
for (const jobName of Object.values(STATE_MACHINE_JOB_NAMES)) {
  metricNames[
    `STATE_MACHINE_${jobName}_JOB_DURATION_SECONDS_HISTOGRAM`
  ] = `state_machine_${_.snakeCase(jobName)}_job_duration_seconds`
}
const METRIC_NAMES = Object.freeze(
  _.mapValues(metricNames, (metricName) => `${NAMESPACE_PREFIX}_${metricName}`)
)

const METRIC_LABELS = Object.freeze({
  [METRIC_NAMES.ISSUE_SYNC_REQUEST_MONITORING_DURATION_SECONDS_HISTOGRAM]: {
    // The type of sync issued -- manual or recurring
    syncType: [_.snakeCase(SyncType.Manual), _.snakeCase(SyncType.Recurring)],
    // The reason another sync is needed
    reason_for_additional_sync: [
      'secondary_progressed_too_slow', // The secondary sync went through, but its clock value didn't increase enough
      'secondary_failed_to_progress', // The secondary's clock value did not increase at all
      'none' // No additional sync is required -- the first sync was successful
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
      'primary_and_or_secondaries', // A secondary gets promoted to new primary and one or both secondaries get replaced with new random nodes,
      'null' // No change was made to the user's replica set because the job short-circuited before selecting or was unable to select new node(s)
    ]
  },
  [METRIC_NAMES.FIND_SYNC_REQUEST_COUNTS_GAUGE]: {
    result: [
      'not_checked', // Default value -- means the logic short-circuited before checking if the primary should sync to the secondary. This can be expected if this node wasn't the user's primary
      'no_sync_already_marked_unhealthy', // Sync not found because the secondary was marked unhealthy before being passed to the find-sync-requests job
      'no_sync_sp_id_mismatch', // Sync not found because the secondary's spID mismatched what the chain reported
      'no_sync_success_rate_too_low', // Sync not found because the success rate of syncing to this secondary is below the acceptable threshold
      'no_sync_secondary_data_matches_primary', // Sync not found because the secondary's clock value and filesHash match primary's
      'no_sync_unexpected_error', // Sync not found because some uncaught error was thrown
      'new_sync_request_enqueued_primary_to_secondary', // Sync was found from primary->secondary because all other conditions were met and primary clock value was greater than secondary
      'new_sync_request_enqueued_secondary_to_primary', // Sync was found from secondary->primary because all other conditions were met and secondary clock value was greater than primary
      'sync_request_already_enqueued', // Sync was found but a duplicate request has already been enqueued so no need to enqueue another
      'new_sync_request_unable_to_enqueue' // Sync was found but something prevented a new request from being created
    ]
  }
})
const MetricLabelNames = Object.freeze(
  Object.fromEntries(
    Object.entries(METRIC_LABELS).map(([metric, metricLabels]) => [
      metric,
      Object.keys(metricLabels)
    ])
  )
)

const METRICS = Object.freeze({
  [METRIC_NAMES.SYNC_QUEUE_JOBS_TOTAL_GAUGE]: {
    metricType: METRIC_TYPES.GAUGE,
    metricConfig: {
      name: METRIC_NAMES.SYNC_QUEUE_JOBS_TOTAL_GAUGE,
      help: 'Current job counts for SyncQueue by status',
      labelNames: ['status']
    }
  },
  /** @notice This metric will eventually be replaced by an express route metrics middleware */
  [METRIC_NAMES.ROUTE_POST_TRACKS_DURATION_SECONDS_HISTOGRAM]: {
    metricType: METRIC_TYPES.HISTOGRAM,
    metricConfig: {
      name: METRIC_NAMES.ROUTE_POST_TRACKS_DURATION_SECONDS_HISTOGRAM,
      help: 'Duration for POST /tracks route',
      labelNames: ['code'],
      buckets: [0.1, 0.3, 0.5, 1, 3, 5, 10] // 0.1 to 10 seconds
    }
  },
  [METRIC_NAMES.ISSUE_SYNC_REQUEST_MONITORING_DURATION_SECONDS_HISTOGRAM]: {
    metricType: METRIC_TYPES.HISTOGRAM,
    metricConfig: {
      name: METRIC_NAMES.ISSUE_SYNC_REQUEST_MONITORING_DURATION_SECONDS_HISTOGRAM,
      help: 'Seconds spent monitoring an outgoing sync request issued by this node to be completed (successfully or not)',
      labelNames:
        MetricLabelNames[
          METRIC_NAMES.ISSUE_SYNC_REQUEST_MONITORING_DURATION_SECONDS_HISTOGRAM
        ],
      // 5 buckets in the range of 1 second to max seconds before timing out a sync request
      buckets: exponentialBucketsRange(
        1,
        config.get('maxSyncMonitoringDurationInMs') / 1000,
        5
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
            ...(MetricLabelNames[
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
      labelNames: MetricLabelNames[METRIC_NAMES.FIND_SYNC_REQUEST_COUNTS_GAUGE]
    }
  }
})

module.exports = {
  NAMESPACE_PREFIX,
  METRIC_TYPES,
  METRIC_NAMES,
  METRIC_LABELS,
  METRIC_RECORD_TYPE,
  METRICS
}
