const Prometheus = require('prom-client')

const { sendResponse, errorResponseServerError } = require('../apiHelpers')
const PrometheusMetric = require('../services/PrometheusMetric')

const metricPrefix = 'audius_cn_'

// collect default metrics recommended by Prometheus:
// event loop lag, active handles, GC, and Node.js version.
// must be called only once before '/prometheus_metrics' is hit
Prometheus.collectDefaultMetrics({ prefix: metricPrefix })

module.exports = function (app) {
  app.get('/prometheus_metrics', async (req, res) => {
    try {
      // these collect any internal "gauges" that report point-in-time metrics,
      // as opposed to histograms which are great for timing pieces of code
      PrometheusMetric.populateCollectors()

      // uses the Prometheus client to generate a Prometheus-friendly text output
      // for a Prometheus instance to scrape
      return sendResponse(req, res, {
        statusCode: 200,
        object: await Prometheus.register.metrics()
      })
    } catch (e) {
      console.error('Prometheus Metrics Exporter error:', e)
      return errorResponseServerError(e.message)
    }
  })
}
