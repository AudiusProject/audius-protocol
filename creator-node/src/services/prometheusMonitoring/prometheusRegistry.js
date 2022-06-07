const prometheusClient = require('prom-client')

const { Metrics, MetricNames } = require('./prometheusMetrics.constants')

module.exports = class PrometheusRegistry {
  constructor(collectDefaultMetrics = true) {
    this.registry = prometheusClient.register
    this.metricNames = MetricNames

    // Add a default label which is added to all metrics
    this.registry.setDefaultLabels({
      serviceType: 'audius_content_node'
    })

    if (collectDefaultMetrics) {
      prometheusClient.collectDefaultMetrics()
    }

    this._setupCustomMetrics()
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

  _setupCustomMetrics() {
    for (const { metricType: MetricType, metricConfig } of Object.values(
      Metrics
    )) {
      const metric = new MetricType(metricConfig)
      this.registry.registerMetric(metric)
    }
  }
}
