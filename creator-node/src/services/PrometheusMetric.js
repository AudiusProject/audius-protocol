const client = require('prom-client')

const PrometheusType = Object.freeze({
  HISTOGRAM: 'histogram',
  GAUGE: 'gauge'
})

/**
 * Class to maintain library-specific logic
 * for Prometheus-bound metrics
 */
class PrometheusMetric {
  // use these static vars to avoid name collisions
  // and register collectors to be run by the PrometheusMetricExporter
  static histograms = {}
  static gauges = {}
  static registeredCollectors = {}

  constructor({ name, description, labelNames, metricType }) {
    // set this.startTime to now()
    this.resetTimer()

    // set metric prefix of audius_project_
    name = `audius_cn_${name}`

    this.metricType = metricType
    if (this.metricType === undefined) {
      this.metricType = PrometheusType.HISTOGRAM
    }

    // CollectorRegistries must be uniquely named
    // NOTE: we only set labelNames once.
    // unsure if overloading is supported.
    if (this.metricType === PrometheusType.HISTOGRAM) {
      this._initMetric(
        name,
        description,
        labelNames,
        PrometheusMetric.histograms,
        client.Histogram
      )
    } else if (this.metricType === PrometheusType.GAUGE) {
      this._initMetric(
        name,
        description,
        labelNames,
        PrometheusMetric.gauges,
        client.Gauge
      )
    } else {
      throw new Error(`metricType '${this.metricType}' not found`)
    }
  }

  /**
   * Helper to avoid naming collisions.
   */
  _initMetric(
    name,
    description,
    labelNames,
    collection,
    PrometheusMetricClass
  ) {
    if (!(name in collection)) {
      collection[name] = new PrometheusMetricClass({
        name: name,
        help: description,
        labelNames: labelNames
      })
    }
    this.metric = collection[name]
  }

  /**
   * Useful when timing complex functionality.
   */
  resetTimer() {
    this.startTime = Date.now()
  }

  /**
   * Return elapsed time since metric was created.
   * Useful for logs.
   * @param {number} [startTime=this.startTime] Return elapsed time since startTime.
   */
  elapsed(startTime) {
    if (startTime === undefined) {
      startTime = this.startTime
    }
    return Date.now() - startTime
  }

  /**
   * Save a metric with the value of elapsed time since a start time.
   * @param {Object[]} [labels] An array of label:value pairs to apply to the metric.
   * @param {number} [startTime] The startTime to use with this data point.
   */
  saveTime(labels, startTime) {
    this.save(this.elapsed(startTime), labels)
  }

  /**
   * Save a metric data point.
   * @param {number} value The value to save with this data point.
   * @param {Object[]} [labels] An array of label:value pairs to apply to the metric.
   */
  save(value, labels) {
    let thisMetric = this.metric
    if (labels !== undefined) {
      thisMetric = thisMetric.labels(labels)
    }

    if (this.metricType === PrometheusType.HISTOGRAM) {
      thisMetric.observe(value)
    } else if (this.metricType === PrometheusType.GAUGE) {
      thisMetric.set(value)
    }
  }

  /**
   * Register "collectors" to be run when scraping the exporter.
   * These "collectors" are best used to populate gauges with point-in-time values.
   * @param {string} name A unique identifier to avoid duplicate registration.
   * @param {function} collectorFunc A function that will be called at scrape time.
   */
  static registerCollector(name, collectorFunc) {
    PrometheusMetric.registeredCollectors[name] = collectorFunc
  }

  /**
   * Should be called when a scrape has occurred on the exporter.
   */
  static populateCollectors() {
    for (const collectorFunc of Object.values(
      PrometheusMetric.registeredCollectors
    )) {
      collectorFunc()
    }
  }
}

module.exports = PrometheusMetric
