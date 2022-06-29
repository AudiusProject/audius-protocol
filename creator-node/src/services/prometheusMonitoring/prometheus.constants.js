const promClient = require('prom-client')
const _ = require('lodash')
const config = require('../../config')
const { exponentialBucketsRange } = require('./prometheusUtils')
const {
  JOB_NAMES,
  SyncType
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

let MetricNames = {
  SYNC_QUEUE_JOBS_TOTAL_GAUGE: 'sync_queue_jobs_total',
  ROUTE_POST_TRACKS_DURATION_SECONDS_HISTOGRAM:
    'route_post_tracks_duration_seconds',
  ISSUE_SYNC_REQUEST_MONITORING_DURATION_SECONDS_HISTOGRAM:
    'issue_sync_request_monitoring_duration_seconds'
}
// Add a histogram for each job in the state machine queues.
// Some have custom labels below, and all of them use the label: uncaughtError=true/false
for (const jobName of Object.values(JOB_NAMES)) {
  MetricNames[
    `STATE_MACHINE_${jobName}_JOB_DURATION_SECONDS_HISTOGRAM`
  ] = `state_machine_${_.snakeCase(jobName)}_job_duration_seconds`
}
MetricNames = Object.freeze(
  _.mapValues(MetricNames, (metricName) => NamespacePrefix + metricName)
)

const MetricLabels = Object.freeze({
  [MetricNames.ISSUE_SYNC_REQUEST_MONITORING_DURATION_SECONDS_HISTOGRAM]: {
    // The type of sync issued -- manual or recurring
    syncType: [_.snakeCase(SyncType.Manual), _.snakeCase(SyncType.Recurring)],
    // The reason another sync is needed
    reason_for_additional_sync: [
      'secondary_progressed_too_slow', // The secondary sync went through, but its clock value didn't increase enough
      'secondary_failed_to_progress', // The secondary's clock value did not increase at all
      'none' // No additional sync is required -- the first sync was successful
    ]
  },
  [MetricNames[
    `STATE_MACHINE_${JOB_NAMES.UPDATE_REPLICA_SET}_JOB_DURATION_SECONDS_HISTOGRAM`
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
  [MetricNames.ISSUE_SYNC_REQUEST_MONITORING_DURATION_SECONDS_HISTOGRAM]: {
    metricType: MetricTypes.HISTOGRAM,
    metricConfig: {
      name: MetricNames.ISSUE_SYNC_REQUEST_MONITORING_DURATION_SECONDS_HISTOGRAM,
      help: 'Seconds spent monitoring an outgoing sync request issued by this node to be completed (successfully or not)',
      labelNames:
        MetricLabelNames[
          MetricNames.ISSUE_SYNC_REQUEST_MONITORING_DURATION_SECONDS_HISTOGRAM
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
    Object.values(JOB_NAMES).map((jobName) => [
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
  )
})

module.exports.NamespacePrefix = NamespacePrefix
module.exports.MetricTypes = MetricTypes
module.exports.MetricNames = MetricNames
module.exports.MetricLabels = MetricLabels
module.exports.Metrics = Metrics
