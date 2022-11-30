import type { Cluster } from 'cluster'
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

  _ensureThisProcessIsThePrimary() {
    if (isClusterEnabled() && !cluster.isMaster) {
      throw new Error('This should only be called by the primary process')
    }
  }
}

const clusterUtilsForPrimary = new ClusterUtilsForPrimary()
export { clusterUtilsForPrimary }
