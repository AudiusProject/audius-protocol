// eslint-disable-next-line node/no-extraneous-import
import type { SpanContext } from '@opentelemetry/api'
import type { LogContext } from '../../../utils'

export type SyncRequestAxiosData = {
  wallet: string[]
  creator_node_endpoint?: string
  sync_type?: string
  immediate?: boolean
  forceResync?: boolean
  forceWipe?: boolean
  timestamp?: string
  signature?: string
  sync_even_if_disabled?: boolean
}

export type SyncRequestAxiosParams = {
  baseURL: string
  url: string
  method: string
  data: SyncRequestAxiosData
}

// Issue sync request job
export type ForceResyncSigningData = {
  wallet: string[]
  creator_node_endpoint?: string
  sync_type?: string
  immediate?: boolean
}

export type ForceResyncAuthParams = {
  data: ForceResyncSigningData
  timestamp: string
  signature: string
}

export type ForceResyncConfig = {
  signatureData: ForceResyncAuthParams
  wallet: string
  forceResync?: boolean
  libs: any
  logContext?: LogContext
  logger?: any
} | null

export type IssueSyncRequestJobParams = {
  syncType: string
  syncMode: string
  syncRequestParameters: SyncRequestAxiosParams
  attemptNumber?: number
  parentSpanContext?: SpanContext
}
export type IssueSyncRequestJobReturnValue = {
  error: any
}

// Update replica set job
export type NewReplicaSet = {
  newPrimary: string | null
  newSecondary1: string | null
  newSecondary2: string | null
  issueReconfig: boolean
  reconfigType: string | null
}
export type UserInfo = {
  clock: number
  filesHash: string
}
export type ReplicaToUserInfoMap = {
  [endpoint: string]: UserInfo
}

// Recover orphaned data job
export type RecoverOrphanedDataJobParams = {
  parentSpanContext?: SpanContext
  discoveryNodeEndpoint: string
}
export type RecoverOrphanedDataJobReturnValue = {
  numWalletsOnNode: number
  numWalletsWithNodeInReplicaSet: number
  numWalletsWithOrphanedData: number
}

export type SecondarySyncHealthTrackerState = {
  walletToSecondaryAndMaxErrorReached: WalletToSecondaryAndMaxErrorReached
}

export type WalletToSecondaryAndMaxErrorReached = {
  [wallet: string]: {
    [secondary: string]: string /* the encountered error */
  }
}
