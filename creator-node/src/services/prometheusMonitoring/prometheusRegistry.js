const promClient = require('prom-client')

const { Metrics, MetricNames } = require('./prometheusMetrics.constants')

module.exports = class PrometheusRegistry {
  init({ collectDefaultMetrics = true }) {
    this.registry = promClient.register
    this.metricNames = MetricNames

    // Add a default label which is added to all metrics
    this.registry.setDefaultLabels({
      serviceType: 'audius_content_node'
    })

    if (collectDefaultMetrics) {
      promClient.collectDefaultMetrics()
    }

    this.setupCustomMetrics()
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
    for (const { metricType: MetricType, metricConfig } of Metrics) {
      const metric = new MetricType(metricConfig)
      this.registry.registerMetric(metric)
    }
  }
}
