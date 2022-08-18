# Prometheus Monitoring

Content Node records and exposes metrics for consumption by Prometheus (https://prometheus.io/docs).

Metrics are exposed via the `GET /prometheus_metrics` route.

We use [JS client library `prom-client`](https://github.com/siimon/prom-client) to produce these metrics.

## Definitions

**Metric Type** = counter, gauge, histogram, summary  
**Metric** = instance of Metric Type, e.g. `http_request_duration_seconds`  
**Time Series** = stream of timestamped values belonging to single Metric and set of Labeled dimensions. It is comprised of Samples.  
**Sample** = a single value at a point-in-time in a Time Series; consists of 1) float-64 value and 2) millisecond-precision timestamp  
**Metric Value** = current value of Metric, e.g. `audius_cn_sync_queue_jobs_total{status="manual_waiting"} 0`  
**Exporter** = Route at which this target exports internal metrics, from which Prometheus server pulls metrics. Currently set to `/prometheus_metrics`

Details in docs: [Data Model](https://prometheus.io/docs/concepts/data_model/) / [Glossary](https://prometheus.io/docs/introduction/glossary/)


## Understanding Prometheus Metrics

Currently, 2 types of metrics are supported: Gauge, and Histogram.

https://prometheus.io/docs/concepts/metric_types/

https://prometheus.io/docs/tutorials/understanding_metric_types/

### Gauge ([API Docs](https://github.com/siimon/prom-client#gauge) / [Prometheus Docs](https://prometheus.io/docs/tutorials/understanding_metric_types/#gauge))

A Gauge represents a single numerical value that can be set, or arbitrarily go up and down.  
Gauges are useful for snapshots of state, such as in-progress requests, free/total memory, or temperature. You should never take a rate() of a gauge.

### Histogram ([API Docs](https://github.com/siimon/prom-client#histogram) / [Prometheus Docs](https://prometheus.io/docs/tutorials/understanding_metric_types/#histogram))

> A histogram samples observations (usually things like request durations or response sizes) and counts them in configurable buckets. It also provides a sum of all observed values.

Best practices - https://prometheus.io/docs/practices/histograms/

### Counters and Summaries

Prometheus also supports 2 other types of metrics: Counter and Summary. These are currently disabled, since we should almost never be using them.
- A Gauge should always be used over Counter since it can be decreased, with no performance overhead.
- Histogram should always be used over Summary, per [docs](https://prometheus.io/docs/tutorials/understanding_metric_types/#summary).

## Metric Labeling (Important)

For more details, please read "Use labels" and "Do not overuse labels" from docs - https://prometheus.io/docs/practices/instrumentation/#use-labels

In Prometheus, labels are very important. Important excerpts from docs (see links below for full docs)

> When you have multiple metrics that you want to add/average/sum, they should usually be one metric with labels rather than multiple metrics.

> For example, rather than http_responses_500_total and http_responses_403_total, create a single metric called http_responses_total with a code label for the HTTP response code. You can then process the entire metric as one in rules and graphs.

> As a rule of thumb, no part of a metric name should ever be procedurally generated (use labels instead). The one exception is when proxying metrics from another monitoring/instrumentation system.

> As a general guideline, try to keep the cardinality of your metrics below 10, and for metrics that exceed that, aim to limit them to a handful across your whole system. The vast majority of your metrics should have no labels.

> If you are unsure, start with no labels and add more labels over time as concrete use cases arise.

### Labeling and Cardinality

Cardinality = different values for a given metric. For example:

```
Metric = 'audius_route_post_tracks_duration_seconds'
Metric type = Histogram
Label = 'code'
Label values = '2xx', '3xx', '4xx', '5xx'
Metric buckets: [0.1, 0.3, 0.5, 1, 3, 5, 10]
A histogram metric creates the following time series for each label value:
- sum
- count
- each bucket (7, in the above example)

In this example, with a max of 4 values for Label 'code', and 7 buckets, the label has a max cardinality of 36.
```

Prometheus server v2.x can handle ~10 million time series in a time window.
Since we currently have ~100 servers (aka Prometheus targets), and can assume a future max of 1000, this means each server should not have more than `10 million series / 1000 servers = 10,000` time series.

Given the above, some important conclusions:
- Keep cardinality for each metric to a minimum
- Use gauges over histograms where possible
- Keep histogram buckets to a minimum
- Never use labels for something with high cardinality such as users

[Blog post on Prometheus cardinality](https://www.robustperception.io/cardinality-is-key/)

## Metric Naming

[From docs:](https://prometheus.io/docs/practices/naming/)
- Always use snake case for metric and label names.

## How to add a new Metric

### Create metric in `./prometheus.constants.js`

Add row to `METRIC_NAMES`
- Key should include a suffix for metric type (either _GAUGE or _HISTOGRAM)

Add new object to `METRICS`
- Key should be reference to METRIC_NAMES entry
- Value should be an object containing the metricType and metricConfig
- for metricConfig, specify required config for metricType.

**MetricConfig**
Every metric must define a `name` and `help` property.

Metrics should define a `labelNames` property where appropriate. [See docs for info](https://github.com/siimon/prom-client#labels).

Histograms, must also define a `buckets` property. This can be defined [manually](https://github.com/siimon/prom-client#configuration-1), or via a [bucket generator](https://github.com/siimon/prom-client#bucket-generators).

### Consume metric where appropriate

In application code, first fetch the metric from PrometheusRegistry:
```
const <metricName> = prometheusRegistry.getMetric(prometheusRegistry.metricNames.<METRIC_NAME>)
```

See below API to record new sample for metric.
- Gauge - https://github.com/siimon/prom-client#gauge
- Histogram - https://github.com/siimon/prom-client#histogram

### Example - Storage Path Size Gauge

Definition inside `prometheus.constants.js`
```
let METRIC_NAMES = {
  ...
  SYNC_QUEUE_JOBS_TOTAL_GAUGE: 'sync_queue_jobs_total',
  ...
}

const METRICS = Object.freeze({
  ...
  [METRIC_NAMES.SYNC_QUEUE_JOBS_TOTAL_GAUGE]: {
    metricType: METRIC_TYPES.GAUGE,
    metricConfig: {
      name: METRIC_NAMES.SYNC_QUEUE_JOBS_TOTAL_GAUGE,
      help: 'Current job counts for SyncQueue by status',
      labelNames: ['status']
    }
  },
  ...
})
```
