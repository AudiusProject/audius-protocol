import { Gauge } from 'prom-client'

export default {
  metricType: Gauge,
  metricLabels: {} as { [labelName: string]: readonly string[] },
  metricConfig: {
    help: 'Number of syncs enqueued to recover data orphaned on this node',
    aggregator: 'max'
  }
} as const
