const PrometheusClient = require('prom-client')

const {
  METRIC_PREFIX,
  Metrics,
  MetricNames
} = require('./prometheus.constants')

module.exports = class PrometheusRegistry {
  constructor() {
    this.registry = PrometheusClient.register
    this.metricNames = MetricNames

    // Enable collection of default metrics (e.g. heap, cpu, event loop)
    PrometheusClient.collectDefaultMetrics({ prefix: METRIC_PREFIX })

    createAllCustomMetrics(this.registry)
  }

  /** Getters */

  async getAllMetricData() {
    return this.registry.metrics()
  }

  /** Returns single metric instance by name */
  getMetric(name) {
    return this.registry.getSingleMetric(name)
  }
}

/**
 * Creates and registers every custom metric, for use throughout Content Node
 */
const createAllCustomMetrics = function (registry) {
  for (const { metricType: MetricType, metricConfig } of Object.values(
    Metrics
  )) {
    // Add standard prefix to metric name
    metricConfig.name = METRIC_PREFIX + metricConfig.name

    // Create and register instance of MetricType, with provided metricConfig
    const metric = new MetricType(metricConfig)
    registry.registerMetric(metric)
  }
}
