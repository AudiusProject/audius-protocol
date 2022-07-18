const PrometheusClient = require('prom-client')
const prometheusMiddleware = require('express-prom-bundle')

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

    // Ensure clean state for registry
    this.registry.clear()

    // Enable collection of default metrics (e.g. heap, cpu, event loop)
    PrometheusClient.collectDefaultMetrics({
      prefix: NAMESPACE_PREFIX + '_default_'
    })

    this.initStaticMetrics(this.registry)

    this.middleware = null

    // Expose metric names from class for access throughout application
    this.metricNames = { ...METRIC_NAMES }

    this.namespacePrefix = NAMESPACE_PREFIX

    this.initialized = false
  }

  /**
   * Creates and registers every static metric defined in prometheus.constants.js
   */
  initStaticMetrics(registry) {
    for (const { metricType: MetricType, metricConfig } of Object.values(
      METRICS
    )) {
      // Create and register instance of MetricType, with provided metricConfig
      const metric = new MetricType(metricConfig)
      registry.registerMetric(metric)
    }
  }

  /**
   * Initializes and returns the Prometheus middleware that will dynamically match routes
   * with route params using the Express initialized regexes.
   * @param {Object[]} routes routes that have the elements route.path or handle.stack. See app.js
   * @returns the initialized Prometheus middleware
   */
  initDurationTrackingMiddleware(regexes) {
    this.middleware = prometheusMiddleware({
      promRegistry: this.registry,
      httpDurationMetricName: `${this.namespacePrefix}_http_request_duration_seconds`,
      includeMethod: true,
      includePath: true,
      includeUp: false, // Disable, since this enabled flag just returns an auxiliary "up" metric that always returns 1
      autoregister: false, // Do not register the Prometheus metrics route to be tracked
      normalizePath: function (req, opts) {
        // If a route has route params, this normalize fn uses regex to match on it
        const path = prometheusMiddleware.normalizePath(req, opts)
        try {
          for (const { regex, path: replacerPath } of regexes) {
            const match = path.match(regex)
            if (match) {
              return replacerPath
            }
          }
        } catch (e) {
          req.logger.warn(`Could not match on regex: ${e.message}`)
        }
        return path
      }
    })

    this.initialized = true
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
