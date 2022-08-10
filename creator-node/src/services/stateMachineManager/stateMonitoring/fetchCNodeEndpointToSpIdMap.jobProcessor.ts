import type { DecoratedJobParams, DecoratedJobReturnValue } from '../types'
import type {
  FetchCNodeEndpointToSpIdMapJobParams,
  FetchCNodeEndpointToSpIdMapJobReturnValue
} from './types'
import type { Span } from '@opentelemetry/api'

const initAudiusLibs = require('../../initAudiusLibs')
const NodeToSpIdManager = require('../CNodeToSpIdMapManager')

const { SpanStatusCode } = require('@opentelemetry/api')
const { SemanticAttributes } = require('@opentelemetry/semantic-conventions')
const { getTracer } = require('../../../tracer')

/**
 * Processes a job to update the cNodeEndpoint->spId map by reading the chain.
 *
 * @param {Object} param job data
 * @param {Object} param.logger the logger that can be filtered by jobName and jobId
 * @return {Object} the updated mapping, which will be used to update the enabled reconfig modes in stateMachineManager/index.js, and any error message that occurred
 */
module.exports = async function ({
  logger,
  parentSpanContext
}: DecoratedJobParams<FetchCNodeEndpointToSpIdMapJobParams>): Promise<
  DecoratedJobReturnValue<FetchCNodeEndpointToSpIdMapJobReturnValue>
> {
  const options = {
    links: [
      {
        context: parentSpanContext
      }
    ],
    attributes: {
      [SemanticAttributes.CODE_FUNCTION]:
        'fetchCNodeEndpointToSpIdMap.jobProcessor',
      [SemanticAttributes.CODE_FILEPATH]: __filename
    }
  }
  return getTracer().startActiveSpan(
    'fetchCNodeEndpointToSpIdMap.jobProcessor',
    options,
    async (span: Span) => {
      let errorMsg = ''
      try {
        span.addEvent('init libs')
        const audiusLibs = await initAudiusLibs({
          enableEthContracts: true,
          enableContracts: false,
          enableDiscovery: false,
          enableIdentity: false,
          logger
        })
        await NodeToSpIdManager.updateCnodeEndpointToSpIdMap(
          audiusLibs.ethContracts
        )
      } catch (e: any) {
        span.recordException(e)
        span.setStatus({ code: SpanStatusCode.ERROR })
        errorMsg = e.message || e.toString()
        logger.error(`updateEndpointToSpIdMap Error: ${errorMsg}`)
      }
      span.end()
      return {
        cNodeEndpointToSpIdMap: NodeToSpIdManager.getCNodeEndpointToSpIdMap(),
        spanContext: span.spanContext(),
        errorMsg
      }
    }
  )
}
