const _ = require('lodash')

const { createChildLogger } = require('../../logging')
const redis = require('../../redis')
const { JOB_NAMES } = require('./stateMachineConstants')

/**
 * Higher order function to wrap a job processor with a logger and a try-catch.
 *
 * @param {string} jobName used to filter by `jobName` tag in the logger
 * @param {Object{id, data}} job `job.id` is used to filter by `jobId` tag in the logger
 * @param {Function<logger, args>} jobProcessor the processor function that takes a logger and then the contents `job.data` as its args
 * @param {Object} parentLogger the base logger so that queries can filter by its properties as well
 * @param {Object} prometheusRegistry the registry for prometheus to log metrics
 * @returns the result of the completed job, or an object with an error property if the job throws
 */
module.exports = async function (
  jobName,
  job,
  jobProcessor,
  parentLogger,
  prometheusRegistry
) {
  const { id: jobId, data: jobData } = job

  const jobLogger = createChildLogger(parentLogger, { jobName, jobId })
  jobLogger.info(`New job: ${JSON.stringify(job)}`)

  const jobDurationSecondsHistogram = prometheusRegistry.getMetric(
    prometheusRegistry.metricNames[
      `STATE_MACHINE_${jobName}_JOB_DURATION_SECONDS_HISTOGRAM`
    ]
  )
  const metricEndTimerFn = jobDurationSecondsHistogram.startTimer()

  let result
  try {
    await redis.set(`latestJobStart_${jobName}`, Date.now())
    result = await jobProcessor({ logger: jobLogger, ...jobData })
    metricEndTimerFn({ uncaughtError: false, ...getLabels(jobName, result) })
    await redis.set(`latestJobSuccess_${jobName}`, Date.now())
  } catch (error) {
    jobLogger.error(`Error processing job: ${error}`)
    result = { error: error.message || `${error}` }
    metricEndTimerFn({ uncaughtError: true })
  }

  return result
}

/**
 * Creates prometheus label names and values that are specific to the given job type and its results.
 * @param {string} jobName the name of the job to generate metrics for
 * @param {Object} jobResult the result of the job to generate metrics for
 */
const getLabels = (jobName, jobResult) => {
  if (jobName === JOB_NAMES.UPDATE_REPLICA_SET) {
    const { issuedReconfig, newReplicaSet } = jobResult
    return {
      issuedReconfig: issuedReconfig || 'false',
      reconfigType: _.snakeCase(newReplicaSet?.reconfigType || 'null')
    }
  }
  return {}
}
