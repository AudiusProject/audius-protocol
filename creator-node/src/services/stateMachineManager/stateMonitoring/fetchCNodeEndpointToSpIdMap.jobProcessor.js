const initAudiusLibs = require('../../initAudiusLibs')
const NodeToSpIdManager = require('../CNodeToSpIdMapManager')

/**
 * Processes a job to update the cNodeEndpoint->spId map by reading the chain.
 *
 * @param {Object} param job data
 * @param {Object} param.logger the logger that can be filtered by jobName and jobId
 * @return {Object} the updated mapping, which will be used to update the enabled reconfig modes in stateMachineManager/index.js, and any error message that occurred
 */
module.exports = async function ({ logger }) {
  let errorMsg = ''
  try {
    const audiusLibs = await initAudiusLibs(true)
    await NodeToSpIdManager.updateCnodeEndpointToSpIdMap(
      audiusLibs.ethContracts
    )
  } catch (e) {
    errorMsg = e.message || e.toString()
    logger.error(`updateEndpointToSpIdMap Error: ${errorMsg}`)
  }
  return {
    cNodeEndpointToSpIdMap: NodeToSpIdManager.getCNodeEndpointToSpIdMap(),
    errorMsg
  }
}
