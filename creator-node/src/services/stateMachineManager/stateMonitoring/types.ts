import type { IssueSyncRequestJobParams } from '../stateReconciliation/types'
import type { SpanContext } from '@opentelemetry/api'

export type StateMonitoringUser = {
  primary: string
  secondary1: string
  secondary2: string
  primarySpID: number
  secondary1SpID: number
  secondary2SpID: number
  user_id: number
  wallet: string
}
export type UserInfo = {
  clock: number
  filesHash: string
}
export type ReplicaToAllUserInfoMaps = {
  [endpoint: string]: {
    [wallet: string]: UserInfo
  }
}
export type UserSecondarySyncMetrics = {
  successRate: number
  successCount: number
  failureCount: number
}
export type UserSecondarySyncMetricsMap = {
  [wallet: string]: {
    [secondary: string]: UserSecondarySyncMetrics
  }
}
export type ReplicaSetNodesToUserWalletsMap = {
  [node: string]: string[]
}

// Fetch CNode To SP_ID Map job
export type CNodeEndpointToSpIdMap = {
  [endpoint: string]: number
}
export type FetchCNodeEndpointToSpIdMapJobParams = {
  parentSpanContext?: SpanContext
}
export type FetchCNodeEndpointToSpIdMapJobReturnValue = {
  cNodeEndpointToSpIdMap: any
}

// Monitor State job
export type MonitorStateJobParams = {
  lastProcessedUserId: number
  discoveryNodeEndpoint: string
  parentSpanContext?: SpanContext
}
export type MonitorStateJobReturnValue = {}

// Find Sync Requests job
export type FindSyncRequestsJobParams = {
  users: StateMonitoringUser[]
  unhealthyPeers: string[]
  replicaToAllUserInfoMaps: ReplicaToAllUserInfoMaps
  userSecondarySyncMetricsMap: UserSecondarySyncMetricsMap
  parentSpanContext?: SpanContext
}
export type FindSyncRequestsJobReturnValue = {
  duplicateSyncReqs: IssueSyncRequestJobParams[]
  errors: string[]
}
export type OutcomeCountsMap = {
  [syncMode: string]: {
    [result: string]: number
  }
}

// Find Replica Set Updates job
export type FindReplicaSetUpdateJobParams = {
  users: StateMonitoringUser[]
  unhealthyPeers: string[]
  replicaToAllUserInfoMaps: ReplicaToAllUserInfoMaps
  userSecondarySyncMetricsMap: UserSecondarySyncMetricsMap
  parentSpanContext?: SpanContext
}
export type FindReplicaSetUpdatesJobReturnValue = {
  cNodeEndpointToSpIdMap: string
}
