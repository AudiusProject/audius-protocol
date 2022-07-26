import type { Job, Queue } from 'bull'

import {
  NAMESPACE_PREFIX,
  METRICS,
  METRIC_NAMES,
  QUEUE_INTERVAL
  // eslint-disable-next-line import/no-unresolved
} from './prometheus.constants'

const PrometheusClient = require('prom-client')

/**
 * See `prometheusMonitoring/README.md` for usage details
 */

enum JobStatus {
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export class PrometheusRegistry {
  registry: any
  metricNames: Record<string, string>
  namespacePrefix: string

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
    status: JobStatus,
    job: Job
  ) {
    if (!job.finishedOn) {
      return
    }

    const jobLabels = {
      status,
      ...labels
    }

    const jobDuration = job.finishedOn - job.processedOn!
    this.getMetric(this.metricNames.JOBS_DURATION_MILLISECONDS_SUMMARY).observe(
      jobLabels,
      jobDuration
    )

    const waitingDuration = job.processedOn! - job.timestamp
    this.getMetric(
      this.metricNames.JOBS_WAITING_DURATION_MILLISECONDS_SUMMARY
    ).observe(jobLabels, waitingDuration)

    this.getMetric(this.metricNames.JOBS_ATTEMPTS_SUMMARY).observe(
      jobLabels,
      job.attemptsMade
    )
  }

  public startQueueMetrics(queue: Queue, useGlobal: boolean) {
    // @ts-ignore
    const keyPrefix = queue.keyPrefix.replace(/.*\{|\}/gi, '')

    const labels = {
      queue_name: queue.name,
      queue_prefix: keyPrefix
    }

    if (useGlobal) {
      queue.on('global:completed', async (jobId: number) => {
        const job = await queue.getJob(jobId)
        this.recordJobMetrics(labels, JobStatus.COMPLETED, job!)
      })
      queue.on('global:failed', async (jobId: number) => {
        const job = await queue.getJob(jobId)
        this.recordJobMetrics(labels, JobStatus.FAILED, job!)
      })
    } else {
      queue.on('completed', (job: Job) => {
        this.recordJobMetrics(labels, JobStatus.COMPLETED, job)
      })
      queue.on('failed', (job: Job) => {
        this.recordJobMetrics(labels, JobStatus.FAILED, job)
      })
    }

    const metricInterval = setInterval(() => {
      queue
        .getJobCounts()
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
        })
    }, QUEUE_INTERVAL)

    return {
      stop: () => clearInterval(metricInterval)
    }
  }
}

module.exports = PrometheusRegistry
