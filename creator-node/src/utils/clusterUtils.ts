import type { Cluster } from 'cluster'
import type { CpuInfo } from 'os'
const cluster: Cluster = require('cluster')
const { cpus }: { cpus: () => CpuInfo[] } = require('os')

const config = require('../config')

/**
 * Some tasks are only done on one worker, which is determined by this util. Those tasks are:
 * - listen for state machine jobs to complete and run onComplete callbacks
 * - regularly add jobs to the session expiration queue on an interval
 */
class ClusterUtils {
  private _isInitWorker = false
  private _specialWorkerId = 1
  get specialWorkerId(): number {
    return this._specialWorkerId
  }

  set specialWorkerId(specialWorkerId: number) {
    this._specialWorkerId = specialWorkerId
  }

  /**
   * Returns true if cluster mode is enabled. If it's disabled, then
   * everything runs on one process with no primary or workers.
   */
  isClusterEnabled() {
    return config.get('clusterModeEnabled')
  }

  /**
   * Returns true if this current worker process is the first worker, which performs
   * some special initialization logic that other workers don't need to duplicate.
   */
  isThisWorkerInit() {
    return !this.isClusterEnabled() || this._isInitWorker
  }

  /**
   * Marks this worker process is the first worker, which performs
   * some special initialization logic that other workers don't need to duplicate.
   */
  markThisWorkerAsInit() {
    this._isInitWorker = true
  }

  isThisWorkerSpecial() {
    return (
      !this.isClusterEnabled() || cluster.worker?.id === this._specialWorkerId
    )
  }

  getNumWorkers() {
    // When cluster mode is disabled there's no primary and no workers, but for math we want to pretend there's 1 worker so we don't divide by 0
    if (!this.isClusterEnabled()) return 1

    // This is called `cpus()` but it actually returns the # of logical cores, which is possibly higher than # of physical cores if there's hyperthreading
    const logicalCores = cpus().length
    return config.get('expressAppConcurrency') || Math.ceil(logicalCores / 2)
  }

  /**
   * Calculates the concurrency that each worker should have to achieve *at least* the given global concurrency.
   * This is a minimum global concurrency that increments by number of workers.
   * Ex: If there are 16 workers, 1 extra job per worker = 16 extra jobs. So global concurrency of 30 would be 32
   * Note that a global concurrency of 1 is not possible with multiple workers, as per the docs:
   * https://docs.bullmq.io/guide/workers/concurrency
   * This means that if the global concurrency given is set to 1, it will have to be 1 per worker not 1 globally.
   * @param globalConcurrency the global concurrency to achieve by splitting concurrency across workers
   * @returns concurrency that each worker process on this machine needs to achieve at least the desired global concurrency
   */
  getConcurrencyPerWorker(globalConcurrency: number) {
    const numWorkers = this.getNumWorkers()
    const concurrencyPerWorker = Math.ceil(globalConcurrency / numWorkers)
    return concurrencyPerWorker || 1
  }
}

const clusterUtils = new ClusterUtils()
export { clusterUtils }
