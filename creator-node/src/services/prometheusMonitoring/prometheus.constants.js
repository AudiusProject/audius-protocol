const promClient = require('prom-client')
const _ = require('lodash')
const config = require('../../config')
const { exponentialBucketsRange } = require('./prometheusUtils')

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
MetricNames = Object.freeze(
  _.mapValues(MetricNames, (metricName) => NamespacePrefix + metricName)
)

const MetricLabels = Object.freeze({
  [MetricNames.ISSUE_SYNC_REQUEST_MONITORING_DURATION_SECONDS_HISTOGRAM]: {
    // The reason another sync is needed
    reason_for_additional_sync: [
      'secondary_progressed_too_slow', // The secondary sync went through, but its clock value didn't increase enough
      'secondary_failed_to_progress', // The secondary's clock value did not increase at all
      'none' // No additional sync is required -- the first sync was successful
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
  }
})

module.exports.NamespacePrefix = NamespacePrefix
module.exports.MetricTypes = MetricTypes
module.exports.MetricNames = MetricNames
module.exports.MetricLabels = MetricLabels
module.exports.Metrics = Metrics
