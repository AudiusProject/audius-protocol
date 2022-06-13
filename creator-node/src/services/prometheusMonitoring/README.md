# Prometheus Monitoring

Content Node records and exposes metrics for consumption by Prometheus (https://prometheus.io/docs).

Metrics are exposed via the `GET /prometheus_metrics` route.

## Understanding Prometheus Metrics

Currently, 2 types of metrics are supported: Gauge, and Histogram.

https://prometheus.io/docs/concepts/metric_types/

https://prometheus.io/docs/tutorials/understanding_metric_types/

### Gauge ([Docs](https://github.com/siimon/prom-client#gauge))

> A gauge is a metric that represents a single numerical value that can arbitrarily go up and down.

> Gauges are typically used for measured values like temperatures or current memory usage, but also "counts" that can go up and down, like the number of concurrent requests.

### Histogram ([Docs](https://github.com/siimon/prom-client#histogram))

> A histogram samples observations (usually things like request durations or response sizes) and counts them in configurable buckets. It also provides a sum of all observed values.

In other words:
> Histograms track sizes and frequency of events.

Best practices - https://prometheus.io/docs/practices/histograms/

### Counters and Summaries

Prometheus also supports 2 other types of metrics: Counter and Summary. These are currently disabled, since we should almost never be using them.
- A Gauge should always be used over Counter since it can be decreased, with no performance overhead.
- Histogram should always be used over Summary, per [docs](https://prometheus.io/docs/tutorials/understanding_metric_types/#summary).

## Metric Labeling (Important)

In Prometheus, labels are very important. Important excerpts from docs (see links below for full docs)

> When you have multiple metrics that you want to add/average/sum, they should usually be one metric with labels rather than multiple metrics.

> For example, rather than http_responses_500_total and http_responses_403_total, create a single metric called http_responses_total with a code label for the HTTP response code. You can then process the entire metric as one in rules and graphs.

> As a rule of thumb, no part of a metric name should ever be procedurally generated (use labels instead). The one exception is when proxying metrics from another monitoring/instrumentation system.

> As a general guideline, try to keep the cardinality of your metrics below 10, and for metrics that exceed that, aim to limit them to a handful across your whole system. The vast majority of your metrics should have no labels.

> If you are unsure, start with no labels and add more labels over time as concrete use cases arise.

For more details, please read "Use labels" and "Do not overuse labels" from docs - https://prometheus.io/docs/practices/instrumentation/#use-labels

## How to add a new Metric

### Create metric in `./prometheus.constants.js`

Add row to `MetricNames`
- Key should include a suffix for metric type (either _GAUGE or _HISTOGRAM)

Add new object to `Metrics`
- Key should be reference to MetricNames entry
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
const MetricNames = Object.freeze({
  ...
  STORAGE_PATH_SIZE_GAUGE: 'storage_path_size_bytes',
  ...
})

const Metrics = Object.freeze({
  ...
  [MetricNames.STORAGE_PATH_SIZE_GAUGE]: {
    metricType: MetricTypes.GAUGE,
    metricConfig: {
      name: MetricNames.STORAGE_PATH_SIZE_GAUGE,
      help: 'Total disk space (free + used) (bytes)'
    }
  },
  ...
})
```

Consumption inside `src/monitors/filesystem.js : getStoragePathSize()`
```
const storagePathSizeGaugeMetric = prometheusRegistry.getMetric(
  prometheusRegistry.metricNames.STORAGE_PATH_SIZE_GAUGE
)
storagePathSizeGaugeMetric.set(total)
```