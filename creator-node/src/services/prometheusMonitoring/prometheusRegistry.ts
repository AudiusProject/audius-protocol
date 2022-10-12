import type { Job, Queue, Worker } from 'bullmq'

import {
  NAMESPACE_PREFIX,
  METRICS,
  METRIC_NAMES,
  QUEUE_INTERVAL
} from './prometheus.constants'
import * as PrometheusClient from 'prom-client'

/**
 * See `prometheusMonitoring/README.md` for usage details
 */

enum JOB_STATUS {
  COMPLETED = 'completed',
  FAILED = 'failed'
}

type MetricsDataAndType = {
  metricsData: any
  contentType: any
}

export class PrometheusRegistry {
  registry: any
  metricNames: Record<string, string>
  namespacePrefix: string
  resolvePromiseToGetAggregatedMetrics?: (data: MetricsDataAndType) => void
  promiseToGetAggregatedMetrics?: Promise<any>

  public constructor() {
    // Use default global registry to register metrics
    this.registry = PrometheusClient.register

    // Ensure clean state for registry
    this.registry.clear()

    // Enable collection of default metrics (e.g. heap, cpu, event loop)
    PrometheusClient.collectDefaultMetrics({
      prefix: NAMESPACE_PREFIX + '_default_'
    })

    this.initStaticMetrics(this.registry)

    // Expose metric names from class for access throughout application
    this.metricNames = { ...METRIC_NAMES }

    this.namespacePrefix = NAMESPACE_PREFIX
  }

  /**
   * Creates and registers every static metric defined in prometheus.constants.js
   */
  public initStaticMetrics(registry: any) {
    for (const { metricType, metricConfig } of Object.values(METRICS)) {
      // Create and register instance of MetricType, with provided metricConfig

      // eslint-disable-next-line new-cap
      const metric = new metricType(metricConfig)
      registry.registerMetric(metric)
    }
  }

  /** Getters */

  /** Returns current data for all metrics */
  public async getAllMetricData() {
    return this.registry.metrics()
  }

  /** Returns single metric instance by name */
  public getMetric(name: string) {
    return this.registry.getSingleMetric(name)
  }

  public recordJobMetrics(
    labels: { [key: string]: string },
    status: JOB_STATUS,
    job: Job
  ) {
    if (!job.finishedOn) {
      return
    }

    const jobLabels = {
      status,
      ...labels
    }

    // job duration in seconds
    const jobDuration = (job.finishedOn - job.processedOn!) / 1000
    this.getMetric(this.metricNames.JOBS_DURATION_SECONDS_HISTOGRAM).observe(
      jobLabels,
      jobDuration
    )

    // job duration in seconds
    const waitingDuration = (job.processedOn! - job.timestamp) / 1000
    this.getMetric(
      this.metricNames.JOBS_WAITING_DURATION_SECONDS_HISTOGRAM
    ).observe(jobLabels, waitingDuration)

    this.getMetric(this.metricNames.JOBS_ATTEMPTS_HISTOGRAM).observe(
      jobLabels,
      job.attemptsMade
    )
  }

  /**
   * @param queue the bull queue to collect metrics on
   * @param worker the bull worker to collect metrics on
   *
   * This function is used to collect prometheus metrics on bull queues
   * by registering callbacks when jobs fail, wait, or complete
   */
  public startQueueMetrics(queue: Queue, worker: Worker) {
    const labels = {
      queue_name: queue.name
    }

    worker.on('completed', (job: Job, _result: any, _prev: string) => {
      const job_name = job?.data?.task || job.name
      this.recordJobMetrics({ job_name, ...labels }, JOB_STATUS.COMPLETED, job)
    })
    worker.on('failed', (job: Job, _error: Error, _prev: string) => {
      const job_name = job?.data?.task || job.name
      this.recordJobMetrics({ job_name, ...labels }, JOB_STATUS.FAILED, job)
    })

    const metricInterval = setInterval(() => {
      queue
        .getJobCounts('completed', 'failed', 'delayed', 'active', 'waiting')
        .then(({ completed, failed, delayed, active, waiting }) => {
          this.getMetric(this.metricNames.JOBS_COMPLETED_TOTAL_GAUGE).set(
            labels,
            completed || 0
          )
          this.getMetric(this.metricNames.JOBS_FAILED_TOTAL_GAUGE).set(
            labels,
            failed || 0
          )
          this.getMetric(this.metricNames.JOBS_DELAYED_TOTAL_GAUGE).set(
            labels,
            delayed || 0
          )
          this.getMetric(this.metricNames.JOBS_ACTIVE_TOTAL_GAUGE).set(
            labels,
            active || 0
          )
          this.getMetric(this.metricNames.JOBS_WAITING_TOTAL_GAUGE).set(
            labels,
            waiting || 0
          )

          return null
        })
        .catch((_) => {})
    }, QUEUE_INTERVAL)

    return {
      stop: () => clearInterval(metricInterval)
    }
  }

  /**
   * Entry point to the flow:
   * 1. This worker sends `requestAggregatedPrometheusMetrics` IPC message to primary process
   * 2. Primary aggregates metrics and sends `receiveAggregatePrometheusMetrics` IPC message back to this worker
   * 3. This worker calls this.resolvePromiseToGetAggregatedMetrics() with the aggregate metrics from primary
   */
  async getCustomAggregateMetricData() {
    // Only initiate the flow if there's not already a promise in flight to get aggregate metrics data.
    // A previous /prometheus_metrics request could've already initiated a promise
    if (this.promiseToGetAggregatedMetrics === undefined) {
      this.promiseToGetAggregatedMetrics = this.makePromiseToGetMetrics()
    }

    const metricsDataAndType = await this.promiseToGetAggregatedMetrics
    return metricsDataAndType
  }

  /**
   * @returns a Promise that will:
   *   * send a `requestAggregatedPrometheusMetrics` message to the primary process to aggregate metrics
   *   * resolve when the primary process sends back a `receiveAggregatePrometheusMetrics` message to this worker
   *   * timeout and reject after 10 seconds if it's not resolved first
   */
  makePromiseToGetMetrics() {
    return new Promise((resolve, reject) => {
      // Timeout and reject after 10 seconds
      const timeout = setTimeout(() => {
        this.resetInFlightPromiseVariables()
        reject(
          new Error(
            'Took too long to get aggregated metrics. This can happen if not all workers have initialized yet.'
          )
        )
      }, 10_000)

      // Set the function that will get called to resolve the promise when this worker
      // receives a `receiveAggregatePrometheusMetrics` IPC message
      this.resolvePromiseToGetAggregatedMetrics = (
        aggregateMetricsDataAndType: MetricsDataAndType
      ) => {
        if (timeout) {
          clearTimeout(timeout)
        }
        this.resetInFlightPromiseVariables()
        resolve(aggregateMetricsDataAndType)
      }

      // Send `requestAggregatedPrometheusMetrics` IPC message to the primary process to aggregate data
      // from all workers. This worker listens for a `receiveAggregatePrometheusMetrics` message, at which point
      // it will call this.resolvePromiseToGetAggregatedMetrics()
      if (process.send) {
        process.send({ cmd: 'requestAggregatedPrometheusMetrics' })
      } else {
        this.resetInFlightPromiseVariables()
        reject(new Error('This process is somehow not a worker'))
      }
    })
  }

  resetInFlightPromiseVariables() {
    this.resolvePromiseToGetAggregatedMetrics = undefined
    this.promiseToGetAggregatedMetrics = undefined
  }
}

module.exports = PrometheusRegistry
