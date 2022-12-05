import { Gauge } from 'prom-client'

export default {
  metricType: Gauge,
  metricLabels: { status: [] as readonly string[] },
  metricConfig: {
    help: 'Current job counts for SyncQueue by status',
    aggregator: 'first'
  }
} as const
