import { Gauge } from 'prom-client'

export default {
  metricType: Gauge,
  metricLabels: { type: [] as readonly string[] },
  metricConfig: {
    help: 'Disk storage size',
    aggregator: 'first'
  }
} as const
