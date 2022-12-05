import { Gauge } from 'prom-client'

export default {
  metricType: Gauge,
  metricLabels: {
    result: ['success', 'failure']
  },
  metricConfig: {
    help: 'Number of total files migrated from a custom storage path to the standard storage path',
    aggregator: 'sum' // Only runs on primary process
  }
} as const
