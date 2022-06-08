const PrometheusClient = require('prom-client')

const { METRIC_PREFIX, Metrics, MetricNames } = require('./prometheus.constants')

module.exports = class PrometheusRegistry {
  constructor() {
    this.registry = PrometheusClient.register
    this.metricNames = MetricNames

    // Enable collection of default metrics (e.g. heap, cpu, event loop)
    PrometheusClient.collectDefaultMetrics({ prefix: METRIC_PREFIX })

    this._createAllCustomMetrics()
  }

  /**
   * Getters
   */

  getAllMetricData() {
    return this.registry.metrics()
  }

  getMetricInstance(name) {
    return this.registry.getSingleMetric(name)
  }

  /**
   * Internal
   */

  /**
   * Creates and registers every custom metric, for use throughout Content Node
   */
  _createAllCustomMetrics() {
    for (const { metricType: MetricType, metricConfig } of Object.values(
      Metrics
    )) {
      metricConfig.name = METRIC_PREFIX + metricConfig.name
      const metric = new MetricType(metricConfig)
      this.registry.registerMetric(metric)
    }
  }
}
