import type { Cluster } from 'cluster'
import type Logger from 'bunyan'

import { isClusterEnabled } from './clusterUtils'
const cluster: Cluster = require('cluster')

/**
 * Cluster utils that are only needed by the primary process (not worker processes).
 */
class ClusterUtilsForPrimary {
  /**
   * Tracks the ID of which worker process is the "special worker."
   * Some tasks are only done on one worker (the "special worker"), including:
   * - listen for state machine jobs to complete and run onComplete callbacks
   * - regularly add jobs to the session expiration queue on an interval
   * - check state machine queues to see if they're missing jobs and enqueue a job to fix if needed
   */
  private _specialWorkerId = -1

  getSpecialWorkerId() {
    this._ensureThisProcessIsThePrimary()
    return this._specialWorkerId
  }

  setSpecialWorkerId(specialWorkerId: number) {
    this._ensureThisProcessIsThePrimary()
    this._specialWorkerId = specialWorkerId
  }

  /**
   * The primary can't record prometheus metrics in cluster mode, so this sends a metric to a worker to record it.
   */
  sendMetricToWorker(
    validateMetricToRecord: (metric: any) => any,
    recordMetrics: (
      prometheusRegistry: any,
      logger: Logger,
      metrics: any[]
    ) => void,
    metricToRecord: any,
    prometheusRegistry: any,
    logger: Logger
  ) {
    const validatedMetricToRecord = validateMetricToRecord(metricToRecord)
    // Non-cluster mode can just record the metric now
    if (!isClusterEnabled()) {
      recordMetrics(prometheusRegistry, logger, [validatedMetricToRecord])
      return
    }

    const msgToRecordMetric = {
      cmd: 'recordMetric',
      val: validatedMetricToRecord
    }
    // Send out to all workers. Only the special worker will end up recording it
    for (const id in cluster.workers) {
      const worker = cluster.workers?.[id]
      if (worker?.isConnected()) {
        worker.send(msgToRecordMetric)
      }
    }
  }

  _ensureThisProcessIsThePrimary() {
    if (isClusterEnabled() && !cluster.isMaster) {
      throw new Error('This should only be called by the primary process')
    }
  }
}

const clusterUtilsForPrimary = new ClusterUtilsForPrimary()
export { clusterUtilsForPrimary }
