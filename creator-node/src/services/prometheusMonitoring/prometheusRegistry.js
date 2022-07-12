const PrometheusClient = require('prom-client')

const {
  NAMESPACE_PREFIX,
  METRICS,
  METRIC_NAMES
} = require('./prometheus.constants')

/**
 * See `prometheusMonitoring/README.md` for usage details
 */

class PrometheusRegistry {
  constructor() {
    // Use default global registry to register metrics
    this.registry = PrometheusClient.register

    // Expose metric names from class for access throughout application
    this.metricNames = { ...METRIC_NAMES }

    // Ensure clean state for registry
    this.registry.clear()

    // Enable collection of default metrics (e.g. heap, cpu, event loop)
    PrometheusClient.collectDefaultMetrics({
      prefix: NAMESPACE_PREFIX + '_default_'
    })

    this.init()
  }

  // Instantiates PrometheusRegistry with the imported custom metrics
  init() {
    for (const { metricType: MetricType, metricConfig } of Object.values(
      METRICS
    )) {
      // Create and register instance of MetricType, with provided metricConfig
      const metric = new MetricType(metricConfig)
      this.registry.registerMetric(metric)
    }
  }

  addMetricName({ key, value }) {
    this.metricNames[key] = value
  }

  /**
   * Create a basic histogram metric and register it
   * @param {Object} config
   * @param {string} config.name the name of the metric
   * @param {string} config.doc english documentation explaining metric
   * @param {string[]} config.labels custom labels of other things to monitor; e.g. a particular cid
   */
  addBasicHistogramMetric({ name, doc: help, labels = [] }) {
    // If name or help is null, or name has special characters, do not attempt
    if (!name || !help || name.match(/[^A-Za-z_0-9]/)) {
      throw new Error(`Improper inputs: name=${name} doc=${help}`)
    }

    const metric = new PrometheusClient.Histogram({
      name: `${NAMESPACE_PREFIX}_api_${name}`,
      help,
      labelNames: ['code' /* status code of route */, ...labels],
      buckets: [0.1, 0.3, 0.5, 1, 3, 5, 10] // 0.1 to 10 seconds
    })

    this.registry.registerMetric(metric)
  }

  /** Getters */

  /** Returns current data for all metrics */
  async getAllMetricData() {
    return this.registry.metrics()
  }

  /** Returns single metric instance by name */
  getMetric(name) {
    return this.registry.getSingleMetric(name)
  }
}

module.exports = PrometheusRegistry
