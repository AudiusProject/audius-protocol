import type { Cluster } from 'cluster'
import { isClusterEnabled } from './clusterUtils'
const cluster: Cluster = require('cluster')

/**
 * Cluster utils that are only needed by worker processes (not the primary).
 */
class ClusterUtilsForWorker {
  /**
   * Some tasks, including clearing old queue state, are only done on
   * the first worker process before initializing other workers.
   */
  private _isThisWorkerFirst = false

  /**
   * Some tasks are only done on one worker (the "special worker"). Those tasks are:
   * - listen for state machine jobs to complete and run onComplete callbacks
   * - regularly add jobs to the session expiration queue on an interval
   * - check state machine queues to see if they're missing jobs and enqueue a job to fix if needed
   */
  private _isThisWorkerSpecial = false

  isThisWorkerFirst() {
    this._ensureThisProcessIsAWorker()
    return !isClusterEnabled() || this._isThisWorkerFirst
  }

  isThisWorkerSpecial() {
    this._ensureThisProcessIsAWorker()
    return !isClusterEnabled() || this._isThisWorkerSpecial
  }

  markThisWorkerAsFirst() {
    this._ensureThisProcessIsAWorker()
    this._isThisWorkerFirst = true
  }

  markThisWorkerAsSpecial() {
    this._ensureThisProcessIsAWorker()
    this._isThisWorkerSpecial = true
  }

  _ensureThisProcessIsAWorker() {
    if (isClusterEnabled() && !cluster.isWorker) {
      throw new Error('This should only be called by a worker process')
    }
  }
}

const clusterUtilsForWorker = new ClusterUtilsForWorker()
export { clusterUtilsForWorker }
module.exports = { clusterUtilsForWorker }
