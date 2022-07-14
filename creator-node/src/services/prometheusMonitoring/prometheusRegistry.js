const PrometheusClient = require('prom-client')
const _ = require('lodash')

const { logger: genericLogger } = require('../../logging')
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

    // A mapping of the route to the route regex
    this.routeToRouteRegex = {}

    // Ensure clean state for registry
    this.registry.clear()

    // Enable collection of default metrics (e.g. heap, cpu, event loop)
    PrometheusClient.collectDefaultMetrics({
      prefix: NAMESPACE_PREFIX + '_default_'
    })

    // This binding is so that these helper fns can be used in the class helper fns
    this.addRoutesDurationTracking = this.addRoutesDurationTracking.bind(this)
    this.addMetricName = this.addMetricName.bind(this)
    this.addBasicHistogramMetric = this.addBasicHistogramMetric.bind(this)
    this.getDurationTrackingMetricName =
      this.getDurationTrackingMetricName.bind(this)

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

  /**
   * Add duration and status code metrics to all routes
   *
   * example:
   *  metric name:
   *    SYNC_STATUS_WALLETPUBLICKEY_SECONDS_HISTOGRAM : sync_status_walletpublickey_seconds
   *  metric config: {
   *    name: 'sync_status_walletpublickey_seconds',
   *    help: 'Duration for /sync_status_:walletpublickey',
   *    labelNames: ['code']
   *  }
   *
   * @param {Object[]} routes Array of objects that look like {path: the api route, method: the api method}
   */
  async addRoutesDurationTracking(routes) {
    const addDurationTracking = async ({ path, method }) => {
      const name = this.getDurationTrackingMetricName(path, method)

      try {
        this.addBasicHistogramMetric({
          name,
          doc: `Duration for ${path}`
        })
        this.addMetricName({
          key: `${name}_HISTOGRAM`.toUpperCase(),
          value: name
        })
      } catch (e) {
        genericLogger.warn(
          `Could not add metrics for ${path} with method ${method}: ${e.message}`
        )
      }
    }

    for (const route of routes) {
      const { path, method } = route

      // Create metrics to track duration and status code for every route
      if (Array.isArray(path)) {
        // For routes with the same path but different methods
        // Example: '/ipfs/:cid' and '/content/:cid'
        for (const p of path) {
          await addDurationTracking({
            path: p,
            method
          })
        }
      } else {
        await addDurationTracking({ path, method })
      }
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
    // If name or help is null, or name has special characters, do not attempt to register metric
    if (!name || !help || name.match(/[^A-Za-z_0-9]/)) {
      throw new Error(`Improper inputs: name=${name} doc=${help}`)
    }

    const metric = new PrometheusClient.Histogram({
      name,
      help,
      labelNames: ['code' /* status code of route */, ...labels],
      buckets: [0.1, 0.3, 0.5, 1, 3, 5, 10] // 0.1 to 10 seconds
    })

    this.registry.registerMetric(metric)
  }

  /** Getters */

  getDurationTrackingMetricName(path, method) {
    return `${NAMESPACE_PREFIX}_api_${method.toLowerCase()}_${_.snakeCase(
      path
    )}_seconds`
  }

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
