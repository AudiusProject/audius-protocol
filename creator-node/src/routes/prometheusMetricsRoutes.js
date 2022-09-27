/* eslint-disable @typescript-eslint/no-misused-promises */
const express = require('express')

const router = express.Router()

/**
 * Exposes Prometheus metrics for the worker (not aggregated) at `GET /prometheus_metrics_worker`
 */

router.get('/prometheus_metrics_worker', async (req, res) => {
  const prometheusRegistry = req.app.get('serviceRegistry').prometheusRegistry
  const metricData = await prometheusRegistry.getAllMetricData()

  res.setHeader('Content-Type', prometheusRegistry.registry.contentType)
  return res.end(metricData)
})

/**
 * Exposes Prometheus metrics aggregated across all workers at `GET /prometheus_metrics`
 */
router.get('/prometheus_metrics', async (req, res) => {
  try {
    const prometheusRegistry = req.app.get('serviceRegistry').prometheusRegistry
    const metrics = await prometheusRegistry.getCustomAggregateMetricData()
    res.setHeader(
      'Content-Type',
      prometheusRegistry.getCustomAggregateContentType()
    )
    res.end(metrics)
  } catch (ex) {
    res.statusCode = 500
    res.send(ex.message)
  }
})

module.exports = router
