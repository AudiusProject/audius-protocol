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
