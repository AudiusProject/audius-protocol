import type { CpuInfo } from 'os'
const { cpus }: { cpus: () => CpuInfo[] } = require('os')

const config = require('../../config')

/**
 * Returns true if cluster mode is enabled. If it's disabled, then
 * everything runs on one process with no primary or workers.
 */
export function isClusterEnabled() {
  return config.get('clusterModeEnabled')
}

export function getNumWorkers() {
  // When cluster mode is disabled there's no primary and no workers, but for math we want to pretend there's 1 worker so we don't divide by 0
  if (!isClusterEnabled()) return 1

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
export function getConcurrencyPerWorker(globalConcurrency: number) {
  const numWorkers = getNumWorkers()
  const concurrencyPerWorker = Math.ceil(globalConcurrency / numWorkers)
  return concurrencyPerWorker || 1
}
