const promClient = require('prom-client')

const METRIC_PREFIX = 'cn_'

/**
 * @notice Counter and Summary metric types are currently disabled, since we should almost never be using them.
 *  - Gauge should always be used over Counter since it can be decreased, with no performance overhead.
 *  - Histogram should always be used over Summary, per docs below
 * https://prometheus.io/docs/tutorials/understanding_metric_types/
 */
const MetricTypes = Object.freeze({
  GAUGE: promClient.Gauge,
  HISTOGRAM: promClient.Histogram
  // COUNTER: promClient.Counter,
  // SUMMARY: promClient.Summary
})

const MetricNames = Object.freeze({
  STORAGE_PATH_SIZE_GAUGE: 'storage_path_size_bytes',
  STORAGE_PATH_USED_GAUGE: 'storage_path_used_bytes',
  ROUTE_POST_TRACKS_DURATION_SECONDS_HISTOGRAM:
    'route_post_tracks_duration_seconds'
})

const Metrics = Object.freeze({
  [MetricNames.STORAGE_PATH_SIZE_GAUGE]: {
    metricType: MetricTypes.GAUGE,
    metricConfig: {
      name: MetricNames.STORAGE_PATH_SIZE_GAUGE,
      help: 'Total disk space (free + used) (bytes)'
    }
  },
  [MetricNames.STORAGE_PATH_USED_GAUGE]: {
    metricType: MetricTypes.GAUGE,
    metricConfig: {
      name: MetricNames.STORAGE_PATH_USED_GAUGE,
      help: 'Used disk space (bytes)'
    }
  },
  [MetricNames.ROUTE_POST_TRACKS_DURATION_SECONDS_HISTOGRAM]: {
    metricType: MetricTypes.HISTOGRAM,
    metricConfig: {
      name: MetricNames.ROUTE_POST_TRACKS_DURATION_SECONDS_HISTOGRAM,
      help: 'Duration for POST /tracks route (seconds)',
      labelNames: ['code'],
      buckets: [0.1, 0.3, 0.5, 1, 3, 5, 10] // 0.1 to 10 seconds
    }
  }
})

module.exports.METRIC_PREFIX = METRIC_PREFIX
module.exports.MetricTypes = MetricTypes
module.exports.MetricNames = MetricNames
module.exports.Metrics = Metrics
