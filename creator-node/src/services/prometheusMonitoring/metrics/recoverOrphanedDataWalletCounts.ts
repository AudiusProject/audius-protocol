import { Gauge } from 'prom-client'

export default {
  metricType: Gauge,
  metricLabels: {} as { [labelName: string]: readonly string[] },
  metricConfig: {
    help: 'Number of wallets found with data orphaned on this node',
    aggregator: 'max'
  }
} as const
