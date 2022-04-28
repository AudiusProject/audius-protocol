const Prometheus = require('prom-client')

const {
  handleResponse,
  errorResponseServerError
} = require('../apiHelpers')
const PrometheusMetric = require('../services/PrometheusMetric')

const metricPrefix = 'audius_cn_'

// collect default metrics recommended by Prometheus:
// event loop lag, active handles, GC, and Node.js version
Prometheus.collectDefaultMetrics({ prefix: metricPrefix })

module.exports = function (app) {
  app.get(
    '/prometheus_metrics',
    handleResponse(async (req, res) => {
      try {
        PrometheusMetric.populateCollectors()
        res.set('Content-Type', Prometheus.register.contentType)
        res.status(200)
        res.end(await Prometheus.register.metrics())
      } catch (e) {
        console.error('Prometheus Metrics Exporter error:', e)
        return errorResponseServerError(e.message)
      }
    })
  )
}
