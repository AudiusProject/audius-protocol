import { Gauge } from 'prom-client'

export default {
  metricType: Gauge,
  metricLabels: {
    result: ['success', 'failure']
  },
  metricConfig: {
    help: 'Number of total files migrated from a legacy storage path to a non legacy storage path',
    aggregator: 'sum' // Only runs on primary process
  }
} as const
