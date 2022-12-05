import { Histogram } from 'prom-client'

import { exponentialBucketsRange } from '../prometheusSetupUtils'

export default {
  metricType: Histogram,
  metricLabels: {
    queue_name: [] as readonly string[],
    job_name: [] as readonly string[],
    status: [] as readonly string[]
  },
  metricConfig: {
    help: 'Time to complete jobs',
    // 10 buckets in the range of 1 seconds to max to 10 minutes
    buckets: exponentialBucketsRange(1, 600, 10),
    aggregator: 'average'
  }
} as const
