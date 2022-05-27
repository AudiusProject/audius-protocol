const promClient = require('prom-client')

module.exports = class PrometheusRegistry {
  init({ collectDefaultMetrics = true }) {
    this.register = new promClient.Registry()

    // Add a default label which is added to all metrics
    this.register.setDefaultLabels({
      serviceType: 'audius_content_node'
    })

    this.setupDefaultMetrics(collectDefaultMetrics)
  }

  getAllMetricData() {
    return this.register.metrics()
  }

  async getMetricInstance(name) {
    return this.register.getSingleMetric(name)
  }

  setupDefaultMetrics(collectDefaultMetrics) {
    if (collectDefaultMetrics) {
      promClient.collectDefaultMetrics({
        register: this.register
      })
    }

    this._createHTTPRequestTimerMetric()
  }

  _createHTTPRequestTimerMetric() {
    const timer = new promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'http_request_duration_seconds',
      labelNames: ['method', 'route', 'code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10] // 0.1 to 10 seconds
    })

    this.register.registerMetric(timer)
  }
}
