const promClient = require('prom-client')

const MetricTypes = Object.freeze({
  COUNTER: promClient.Counter,
  GAUGE: promClient.Gauge,
  HISTOGRAM: promClient.Histogram,
  SUMMARY: promClient.Summary
})

const MetricNames = Object.freeze({
  HTTP_REQUEST_DURATION_SECONDS_HISTOGRAM: 'http_request_duration_seconds',
  STORAGE_PATH_SIZE_GAUGE: 'storage_path_size_UNIT_TODO_gauge',
  STORAGE_PATH_USED_GAUGE: 'storage_path_used_UNIT_TODO_gauge'
})

const Metrics = Object.freeze({
  [MetricNames.HTTP_REQUEST_DURATION_SECONDS_HISTOGRAM]: {
    metricType: MetricTypes.HISTOGRAM,
    metricConfig: {
      name: MetricNames.HTTP_REQUEST_DURATION_SECONDS_HISTOGRAM,
      help: 'http_request_duration_seconds',
      labelNames: ['method', 'route', 'code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10] // 0.1 to 10 seconds
    }
  },
  [MetricNames.STORAGE_PATH_SIZE_GAUGE]: {
    metricType: MetricTypes.GAUGE,
    metricConfig: {
      name: MetricNames.STORAGE_PATH_SIZE_GAUGE,
      help: 'asdf'
    }
  },
  [MetricNames.STORAGE_PATH_USED_GAUGE]: {
    metricType: MetricTypes.GAUGE,
    metricConfig: {
      name: MetricNames.STORAGE_PATH_USED_GAUGE,
      help: 'asdf'
    }
  }
})

module.exports.MetricTypes = MetricTypes
module.exports.MetricNames = MetricNames
module.exports.Metrics = Metrics
