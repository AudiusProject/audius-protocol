const PrometheusClient = require('prom-client')

const {
  NamespacePrefix,
  Metrics,
  MetricNames
} = require('./prometheus.constants')

/**
 * See `prometheusMonitoring/README.md` for usage details
 */

module.exports = class PrometheusRegistry {
  constructor() {
    // Use default global registry to register metrics
    this.registry = PrometheusClient.register

    // Expose metric names from class for access throughout application
    this.metricNames = MetricNames

    // Ensure clean state for registry
    this.registry.clear()

    // Enable collection of default metrics (e.g. heap, cpu, event loop)
    PrometheusClient.collectDefaultMetrics({
      prefix: NamespacePrefix + 'default_'
    })

    createAllCustomMetrics(this.registry)
  }

  /** Getters */

  /** Returns current data for all metrics */
  async getAllMetricData() {
    return this.registry.metrics()
  }

  /** Returns single metric instance by name */
  getMetric(name) {
    return this.registry.getSingleMetric(name)
  }
}

/**
 * Creates and registers every custom metric, for use throughout application
 */
const createAllCustomMetrics = function (registry) {
  for (const { metricType: MetricType, metricConfig } of Object.values(
    Metrics
  )) {
    // Create and register instance of MetricType, with provided metricConfig
    const metric = new MetricType(metricConfig)
    registry.registerMetric(metric)
  }
}
