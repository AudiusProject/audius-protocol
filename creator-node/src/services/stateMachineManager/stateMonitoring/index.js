const _ = require('lodash')

const config = require('../../../config')
const { QUEUE_HISTORY, QUEUE_NAMES } = require('../stateMachineConstants')
const { makeQueue } = require('../stateMachineUtils')
const processJob = require('../processJob')
const { logger: baseLogger, createChildLogger } = require('../../../logging')
const fetchCNodeEndpointToSpIdMapJobProcessor = require('./fetchCNodeEndpointToSpIdMap.jobProcessor')

const cNodeEndpointToSpIdMapQueueLogger = createChildLogger(baseLogger, {
  queue: QUEUE_NAMES.FETCH_C_NODE_ENDPOINT_TO_SP_ID_MAP
})

/**
 * Handles setup and job processing of the queue with jobs for:
 * - fetching a slice of users and gathering their state
 * - finding syncs that should be issued for users to sync their data from their primary to their secondaries
 * - finding users who need a replica set update (when an unhealthy primary or secondary should be replaced)
 */
class StateMonitoringManager {
  async init(prometheusRegistry) {
    // Create queue to fetch cNodeEndpoint->spId mapping
    const { queue: cNodeEndpointToSpIdMapQueue } = await makeQueue({
      name: QUEUE_NAMES.FETCH_C_NODE_ENDPOINT_TO_SP_ID_MAP,
      processor: this.makeProcessJob(
        fetchCNodeEndpointToSpIdMapJobProcessor,
        cNodeEndpointToSpIdMapQueueLogger,
        prometheusRegistry
      ).bind(this),
      logger: cNodeEndpointToSpIdMapQueueLogger,
      removeOnComplete: QUEUE_HISTORY.FETCH_C_NODE_ENDPOINT_TO_SP_ID_MAP,
      removeOnFail: QUEUE_HISTORY.FETCH_C_NODE_ENDPOINT_TO_SP_ID_MAP,
      prometheusRegistry,
      limiter: {
        max: 1,
        duration: config.get('fetchCNodeEndpointToSpIdMapIntervalMs')
      }
    })

    return {
      cNodeEndpointToSpIdMapQueue
    }
  }

  /**
   * Adds an initial job to the cNodeEndpoint->spId map queue.
   * Future jobs are added to the queue as a result of this initial job succeeding/failing.
   * @param {Object} queue the cNodeEndpoint->spId map queue to consume jobs from
   * @param {Object} prometheusRegistry the registry of metrics from src/services/prometheusMonitoring/prometheusRegistry.js
   */
  async startEndpointToSpIdMapQueue(queue) {
    // Enqueue first job, which requeues itself upon completion or failure
    await queue.add('first-job', {})
  }

  makeProcessJob(processor, logger, prometheusRegistry) {
    return async (job) => processJob(job, processor, logger, prometheusRegistry)
  }
}

module.exports = StateMonitoringManager
