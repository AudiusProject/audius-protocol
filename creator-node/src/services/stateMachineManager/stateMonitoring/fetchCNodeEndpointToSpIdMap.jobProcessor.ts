import type { DecoratedJobParams, DecoratedJobReturnValue } from '../types'
import type {
  FetchCNodeEndpointToSpIdMapJobParams,
  FetchCNodeEndpointToSpIdMapJobReturnValue
} from './types'

import { instrumentTracing, tracing } from '../../../tracer'
import {
  updateContentNodeChainInfo,
  getMapOfSpIdToChainInfo
} from '../../ContentNodeInfoManager'
import { stringifyMap } from '../../../utils'

/**
 * Processes a job to update the cNodeEndpoint->spId map by reading the chain.
 *
 * @param {Object} param job data
 * @param {Object} param.logger the logger that can be filtered by jobName and jobId
 * @return {Object} the updated mapping, which will be used to update the enabled reconfig modes in stateMachineManager/index.js
 */
async function fetchCNodeEndpointToSpIdMap({
  logger
}: DecoratedJobParams<FetchCNodeEndpointToSpIdMapJobParams>): Promise<
  DecoratedJobReturnValue<FetchCNodeEndpointToSpIdMapJobReturnValue>
> {
  await updateContentNodeChainInfo(logger)
  return {
    cNodeEndpointToSpIdMap: stringifyMap(await getMapOfSpIdToChainInfo(logger))
  }
}

module.exports = async (
  params: DecoratedJobParams<FetchCNodeEndpointToSpIdMapJobParams>
) => {
  const { parentSpanContext } = params
  const jobProcessor = instrumentTracing({
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
  })
  return await jobProcessor(params)
}
