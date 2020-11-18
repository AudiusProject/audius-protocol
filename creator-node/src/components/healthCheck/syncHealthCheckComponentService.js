const { priorityMap } = require('../../snapbackSM')

const getJobInfo = job => ({
  type: job.name,
  priority: priorityMap[job.opts.priority],
  id: job.id,
  wallet: job.data.syncRequestParameters.data.wallet[0],
  secondary: job.data.syncRequestParameters.baseURL
})

const makeResponse = (pendingJobs, activeJobs, jobCounts) => ({
  pending: pendingJobs.map(getJobInfo),
  active: activeJobs.map(getJobInfo),
  counts: jobCounts
})

/**
 * Returns information about sync queue.
 * Response: {
 *  pending: Array<{ type, priority, id }>,
 *  active: Array<{ type, priority, id }>,
 *  counts: { waiting, active, completed, failed, delayed, paused }
 * }
 */
const syncHealthCheck = async ({ snapbackSM }) => {
  const jobs = await snapbackSM.getSyncQueueJobs()
  return makeResponse(jobs.pending, jobs.active, jobs.counts)
}

module.exports = { syncHealthCheck }
