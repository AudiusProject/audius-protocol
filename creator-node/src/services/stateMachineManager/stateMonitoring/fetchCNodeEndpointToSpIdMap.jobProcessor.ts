import type { DecoratedJobParams, DecoratedJobReturnValue } from '../types'
import type {
  FetchCNodeEndpointToSpIdMapJobParams,
  FetchCNodeEndpointToSpIdMapJobReturnValue
} from './types'
import type { SpanContext } from '@opentelemetry/api'

import { SemanticAttributes } from '@opentelemetry/semantic-conventions'
import { SpanStatusCode } from '@opentelemetry/api'

import initAudiusLibs from '../../initAudiusLibs'
import ContentNodeInfoManager from '../ContentNodeInfoManager'
import { getActiveSpan, instrumentTracing } from '../../../utils/tracing'

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
  const span = getActiveSpan()
  let errorMsg = ''
  try {
    span?.addEvent('init AudiusLibs')
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
    span?.recordException(e)
    span?.setStatus({ code: SpanStatusCode.ERROR })
    errorMsg = e.message || e.toString()
    logger.error(`updateEndpointToSpIdMap Error: ${errorMsg}`)
  }
  return {
    cNodeEndpointToSpIdMap: ContentNodeInfoManager.getCNodeEndpointToSpIdMap(),
    spanContext: span?.spanContext(),
    errorMsg
  }
}

// Different from other `instrumentTracing` calls because of the need to link the parentSpanContext
module.exports = ({
  parentSpanContext
}: {
  parentSpanContext: SpanContext
}) => {
  return instrumentTracing({
    name: 'fetchCNodeEndpointToSpIdMap.jobProcessor',
    fn: fetchCNodeEndpointToSpIdMap,
    options: {
      links: [
        {
          context: parentSpanContext
        }
      ],
      attributes: {
        [SemanticAttributes.CODE_FILEPATH]: __filename
      }
    }
  })
}
