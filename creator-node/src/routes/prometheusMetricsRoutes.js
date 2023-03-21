/* eslint-disable @typescript-eslint/no-misused-promises */
const express = require('express')
const { isClusterEnabled } = require('../utils')

const router = express.Router()

const returnMetricsForSingleProcess = async (req, res) => {
  const prometheusRegistry = req.app.get('serviceRegistry').prometheusRegistry
  const metricData = await prometheusRegistry.getAllMetricData()

  res.setHeader('Content-Type', prometheusRegistry.registry.contentType)
  return res.end(metricData)
}

/**
 * Exposes Prometheus metrics for the worker (not aggregated) at `GET /prometheus_metrics_worker`
 */
router.get('/prometheus_metrics_worker', async (req, res) => {
  return returnMetricsForSingleProcess(req, res)
})

/**
 * Exposes Prometheus metrics aggregated across all workers at `GET /prometheus_metrics`
 */
router.get('/prometheus_metrics', async (req, res) => {
  if (!isClusterEnabled()) {
    return returnMetricsForSingleProcess(req, res)
  }

  try {
    const prometheusRegistry = req.app.get('serviceRegistry').prometheusRegistry
    const { metricsData, contentType } =
      await prometheusRegistry.getCustomAggregateMetricData()
    res.setHeader('Content-Type', contentType)
    return res.end(metricsData)
  } catch (ex) {
    res.statusCode = 500
    return res.end(ex.message)
  }
})

module.exports = router
