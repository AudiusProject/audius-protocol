const express = require('express')

const router = express.Router()

/**
 * Exposes Prometheus metrics at `GET /prometheus_metrics`
 */

router.get('/prometheus_metrics', async (req, res) => {
  const prometheusRegistry = req.app.get('serviceRegistry').prometheusRegistry
  const metricData = await prometheusRegistry.getAllMetricData()

  res.setHeader('Content-Type', prometheusRegistry.registry.contentType)
  return res.end(metricData)
})

module.exports = router
