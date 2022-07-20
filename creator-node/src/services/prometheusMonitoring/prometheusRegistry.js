const PrometheusClient = require('prom-client')

const {
  NAMESPACE_PREFIX,
  METRICS,
  METRIC_NAMES
} = require('./prometheus.constants')

/**
 * See `prometheusMonitoring/README.md` for usage details
 */

class PrometheusRegistry {
  constructor() {
    // Use default global registry to register metrics
    this.registry = PrometheusClient.register

    // Ensure clean state for registry
    this.registry.clear()

    // Enable collection of default metrics (e.g. heap, cpu, event loop)
    PrometheusClient.collectDefaultMetrics({
      prefix: NAMESPACE_PREFIX + '_default_'
    })

    this.initStaticMetrics(this.registry)

    // Expose metric names from class for access throughout application
    this.metricNames = { ...METRIC_NAMES }

    this.namespacePrefix = NAMESPACE_PREFIX

    this.regexes = []
  }

  /**
   * Creates and registers every static metric defined in prometheus.constants.js
   */
  initStaticMetrics(registry) {
    for (const { metricType: MetricType, metricConfig } of Object.values(
      METRICS
    )) {
      // Create and register instance of MetricType, with provided metricConfig
      const metric = new MetricType(metricConfig)
      registry.registerMetric(metric)
    }
  }

  /**
   * Initializes the regexes to match on routes with route params
   * @param {RegExp[]} regexes the regexes used to match on routes with route params
   */
  initRouteParamRegexes(regexes) {
    this.regexes = regexes
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

module.exports = PrometheusRegistry
