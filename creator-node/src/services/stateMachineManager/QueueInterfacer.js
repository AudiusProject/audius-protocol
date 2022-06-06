/**
 * Singleton for interfacing with all the queues. Job processors must be functions
 * that take simple, serializable types, so job processors that need to enqueue other jobs
 * will use this interfacer instead of being passed a non-serializable queue.
 */
class QueueInterfacer {
  init(audiusLibs, stateMonitoringQueue, stateReconciliationQueue) {
    this.audiusLibs = audiusLibs
    this.stateMonitoringQueue = stateMonitoringQueue
    this.stateReconciliationQueue = stateReconciliationQueue
  }

  async addStateMonitoringJob(jobName, jobData) {
    const jobInfo = await this.stateMonitoringQueue.add(jobName, jobData)
    return jobInfo
  }

  async addStateReconciliationJob(jobName, jobData) {
    const jobInfo = await this.stateReconciliationQueue.add(jobName, jobData)
    return jobInfo
  }

  getAudiusLibs() {
    return this.audiusLibs
  }
}

module.exports = new QueueInterfacer()
