import type { DecoratedJobParams, DecoratedJobReturnValue } from '../types'
import type {
  FetchCNodeEndpointToSpIdMapJobParams,
  FetchCNodeEndpointToSpIdMapJobReturnValue
} from './types'

const initAudiusLibs = require('../../initAudiusLibs')
const ContentNodeInfoManager = require('../ContentNodeInfoManager')

/**
 * Processes a job to update the cNodeEndpoint->spId map by reading the chain.
 *
 * @param {Object} param job data
 * @param {Object} param.logger the logger that can be filtered by jobName and jobId
 * @return {Object} the updated mapping, which will be used to update the enabled reconfig modes in stateMachineManager/index.js, and any error message that occurred
 */
module.exports = async function ({
  logger
}: DecoratedJobParams<FetchCNodeEndpointToSpIdMapJobParams>): Promise<
  DecoratedJobReturnValue<FetchCNodeEndpointToSpIdMapJobReturnValue>
> {
  let errorMsg = ''
  try {
    const audiusLibs = await initAudiusLibs({
      enableEthContracts: true,
      enableContracts: false,
      enableDiscovery: false,
      enableIdentity: false,
      logger
    })
    await ContentNodeInfoManager.updateContentNodeChainInfo(
      audiusLibs.ethContracts
    )
  } catch (e: any) {
    errorMsg = e.message || e.toString()
    logger.error(`updateEndpointToSpIdMap Error: ${errorMsg}`)
  }
  return {
    cNodeEndpointToSpIdMap: ContentNodeInfoManager.getCNodeEndpointToSpIdMap(),
    errorMsg
  }
}
