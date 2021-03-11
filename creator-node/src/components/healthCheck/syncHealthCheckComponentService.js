const getJobInfo = (job) => ({
  id: job.id,
  secondary: job.data.syncRequestParameters.baseURL,
  syncType: job.data.syncRequestParameters.data.syncType,
  wallet: job.data.syncRequestParameters.data.wallet[0]
})

const makeResponse = (manualWaitingJobs, manualActiveJobs, recurringWaitingJobs, recurringActiveJobs) => ({
  manualWaiting: manualWaitingJobs.map(getJobInfo),
  manualActive: manualActiveJobs.map(getJobInfo),
  recurringWaiting: recurringWaitingJobs.map(getJobInfo),
  recurringActive: recurringActiveJobs.map(getJobInfo),
  manualWaitingCount: manualWaitingJobs.length,
  recurringWaitingCount: recurringWaitingJobs.length
})

/**
 * Returns information about sync queue.
 * Response: {
 *  manualWaiting: Array<{ type, id }>,
 *  manualActive: Array<{ type, id }>,
 *  recurringWaiting: Array<{ type, id }>,
 *  recurringActive: Array<{ type, id }>,
 *  manualWaitingCount: number,
 *  recurringWaitingCount: number
 * }
 */
const syncHealthCheck = async ({ snapbackSM }) => {
  const jobs = await snapbackSM.getSyncQueueJobs()
  return makeResponse(jobs.manualWaiting, jobs.manualActive, jobs.recurringWaiting, jobs.recurringActive)
}

module.exports = { syncHealthCheck }
