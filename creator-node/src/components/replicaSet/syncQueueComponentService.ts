import type { SpanContext } from '@opentelemetry/api'
import type { LogContext } from '../../utils'

/**
 * Enqueues sync operation into syncQueue for provided walletPublicKeys against provided creatorNodeEndpoint
 * @param {Object} params See the SyncQueue for explicit params
 */
export const enqueueSync = async (params: {
  wallet: string
  creatorNodeEndpoint: string
  blockNumber: number
  forceResyncConfig: {
    forceResync: boolean
    signatureData: {
      timestamp: string
      signature: string
      data: any
    }
    wallet: string
  }
  forceWipe: boolean
  syncOverride: boolean
  logContext: LogContext
  parentSpanContext: SpanContext
  serviceRegistry: any
}) => {
  const { serviceRegistry } = params
  // eslint-disable-next-line node/no-sync
  await serviceRegistry.syncQueue.enqueueSync(params)
}

/**
 * Enqueues an sync of MANUAL that will operate immediately
 * @param {Object} params See the SyncImmediateQueue for explicit params
 */
export const processManualImmediateSync = async (params: {
  wallet: string
  creatorNodeEndpoint: string
  blockNumber: number
  forceResyncConfig: {
    forceResync: boolean
    signatureData: {
      timestamp: string
      signature: string
      data: any
    }
    wallet: string
  }
  forceWipe: boolean
  syncOverride: boolean
  logContext: LogContext
  parentSpanContext: SpanContext
  serviceRegistry: any
}) => {
  const { serviceRegistry } = params
  // eslint-disable-next-line node/no-sync
  await serviceRegistry.syncImmediateQueue.processManualImmediateSync(params)
}
