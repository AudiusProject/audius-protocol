import type { Cluster } from 'cluster'
import type { CpuInfo } from 'os'
const cluster: Cluster = require('cluster')
const { cpus }: { cpus: () => CpuInfo[] } = require('os')

const config = require('../config')

/**
 * Some tasks are only done on one worker, which is determined by this util. Those tasks are:
 * - listen for state machine jobs to complete and run onComplete callbacks
 */
class ClusterUtils {
  private _specialWorkerId = 1
  get specialWorkerId(): number {
    return this._specialWorkerId
  }

  set specialWorkerId(specialWorkerId: number) {
    this._specialWorkerId = specialWorkerId
  }

  isThisProcessSpecial() {
    return cluster.worker?.id === this._specialWorkerId
  }

  getNumWorkers() {
    // This is called `cpus()` but it actually returns the # of logical cores, which is possibly higher than # of physical cores if there's hyperthreading
    const logicalCores = cpus().length
    return config.get('expressAppConcurrency') || logicalCores
  }

  getConcurrencyForEnvVar(envVar: string) {
    const globalConcurrency = config.get(envVar)
    return this.getConcurrencyPerWorker(globalConcurrency)
  }

  /**
   * Calculates the concurrency that each worker should have to achieve the given global concurrency.
   * Note that a global concurrency of 1 is not possible with multiple workers, as per the docs:
   * https://docs.bullmq.io/guide/workers/concurrency
   * This means that if the global concurrency given is set to 1, it will have to be 1 per worker not 1 globally.
   * @param globalConcurrency the global concurrency to achieve by splitting concurrency across workers
   * @returns concurrency that each worker process on this machine needs to achieve the desired global concurrency
   */
  getConcurrencyPerWorker(globalConcurrency: number) {
    const numWorkers = this.getNumWorkers()
    const concurrencyPerWorker = Math.floor(globalConcurrency / numWorkers)
    return concurrencyPerWorker || 1
  }
}

const clusterUtils = new ClusterUtils()
export { clusterUtils }
