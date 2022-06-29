const { createChildLogger } = require('../../logging')
const redis = require('../../redis')

/**
 * Higher order function to wrap a job processor with a logger and a try-catch.
 *
 * @param {string} jobName used to filter by `jobName` tag in the logger
 * @param {Object{id, data}} job `job.id` is used to filter by `jobId` tag in the logger
 * @param {Function<logger, args>} jobProcessor the processor function that takes a logger and then the contents `job.data` as its args
 * @param {Object} parentLogger the base logger so that queries can filter by its properties as well
 * @returns the result of the completed job, or an object with an error property if the job throws
 */
module.exports = async function (jobName, job, jobProcessor, parentLogger) {
  const { id: jobId, data: jobData } = job

  const jobLogger = createChildLogger(parentLogger, { jobName, jobId })
  jobLogger.info(`New job: ${JSON.stringify(job)}`)

  let result
  try {
    await redis.set(`latestJobStart_${jobName}`, Date.now())
    result = await jobProcessor({ logger: jobLogger, ...jobData })
    await redis.set(`latestJobSuccess_${jobName}`, Date.now())
  } catch (error) {
    jobLogger.error(`Error processing job: ${error}`)
    result = { error: error.message || `${error}` }
  }

  return result
}
