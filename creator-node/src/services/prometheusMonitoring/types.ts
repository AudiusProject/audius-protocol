import { Gauge, Histogram } from 'prom-client'

export type MetricAggregatorFunc =
  | 'sum'
  | 'first'
  | 'min'
  | 'max'
  | 'average'
  | 'omit'

export type MetricTypeAndConfig = {
  metricType: typeof Gauge | typeof Histogram
  metricLabels: { readonly [labelName: string]: readonly string[] }
  metricConfig: {
    help: string
    // Function to aggregate metrics across workers.
    // See https://github.com/siimon/prom-client/blob/96f7495d66b1a21755f745b1367d3e530668a957/lib/metricAggregators.js#L50
    aggregator: MetricAggregatorFunc
    buckets?: number[]
  }
}
