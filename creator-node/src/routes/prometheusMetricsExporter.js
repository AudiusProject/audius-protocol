const Prometheus = require('prom-client')

const { handleResponse } = require('../apiHelpers')
const PrometheusMetric = require('../services/PrometheusMetric')

const collectDefaultMetrics = Prometheus.collectDefaultMetrics
const metricPrefix = 'audius_cn_'

collectDefaultMetrics({ prefix: metricPrefix })

module.exports = function (app) {
  app.get('/prometheus_metrics', async (req, res) => {
    try {
      PrometheusMetric.populateCollectors()
      res.set('Content-Type', Prometheus.register.contentType)
      res.end(await Prometheus.register.metrics())
    } catch (ex) {
      res.status(500).send({ ex })
      console.error('Prometheus Metrics Exporter error:', ex)
    }
  })
}
