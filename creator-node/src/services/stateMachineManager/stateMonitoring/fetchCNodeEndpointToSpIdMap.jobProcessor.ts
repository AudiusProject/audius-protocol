import type { DecoratedJobParams, DecoratedJobReturnValue } from '../types'
import type {
  FetchCNodeEndpointToSpIdMapJobParams,
  FetchCNodeEndpointToSpIdMapJobReturnValue
} from './types'

import initAudiusLibs from '../../initAudiusLibs'
import ContentNodeInfoManager from '../ContentNodeInfoManager'
import { instrumentTracing, tracing } from '../../../tracer'

/**
 * Processes a job to update the cNodeEndpoint->spId map by reading the chain.
 *
 * @param {Object} param job data
 * @param {Object} param.logger the logger that can be filtered by jobName and jobId
 * @return {Object} the updated mapping, which will be used to update the enabled reconfig modes in stateMachineManager/index.js, and any error message that occurred
 */
const fetchCNodeEndpointToSpIdMap = async ({
  logger
}: DecoratedJobParams<FetchCNodeEndpointToSpIdMapJobParams>): Promise<
  DecoratedJobReturnValue<FetchCNodeEndpointToSpIdMapJobReturnValue>
> => {
  let errorMsg = ''
  try {
    tracing.info('init AudiusLibs')
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
    tracing.recordException(e)
    errorMsg = e.message || e.toString()
    logger.error(`updateEndpointToSpIdMap Error: ${errorMsg}`)
  }
  return {
    cNodeEndpointToSpIdMap: ContentNodeInfoManager.getCNodeEndpointToSpIdMap(),
    spanContext: tracing.currentSpanContext(),
    errorMsg
  }
}

module.exports = async (
  params: DecoratedJobParams<FetchCNodeEndpointToSpIdMapJobParams>
) => {
  const { parentSpanContext } = params
  return await instrumentTracing({
    name: 'fetchCNodeEndpointToSpIdMap.jobProcessor',
    fn: fetchCNodeEndpointToSpIdMap,
    options: {
      links: parentSpanContext
        ? [
            {
              context: parentSpanContext
            }
          ]
        : [],
      attributes: {
        [tracing.CODE_FILEPATH]: __filename
      }
    }
  })(params)
}
