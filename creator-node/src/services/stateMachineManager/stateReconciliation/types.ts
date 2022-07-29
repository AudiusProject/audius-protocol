// Issue sync request job
export type SyncRequestAxiosParams = {
  baseURL: string
  url: string
  method: string
  data: {
    wallet: string[]
    creator_node_endpoint?: string
    sync_type?: string
    immediate?: boolean
  }
}
export type IssueSyncRequestJobParams = {
  syncType: string
  syncMode: string
  syncRequestParameters: SyncRequestAxiosParams
  attemptNumber: number
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
export type UpdateReplicaSetUser = {
  wallet: string
  userId: number
  primary: string
  secondary1: string
  secondary2: string
}
export type UserInfo = {
  clock: number
  filesHash: string
}
export type ReplicaToUserInfoMap = {
  [endpoint: string]: UserInfo
}
export type UpdateReplicaSetJobParamsWithoutEnabledReconfigModes =
  UpdateReplicaSetUser & {
    unhealthyReplicas: string[]
    replicaToUserInfoMap: ReplicaToUserInfoMap
  }
export type UpdateReplicaSetJobParams =
  UpdateReplicaSetJobParamsWithoutEnabledReconfigModes & {
    enabledReconfigModes: string[]
  }
export type UpdateReplicaSetJobReturnValue = {
  errorMsg: string
  issuedReconfig: boolean
  newReplicaSet: NewReplicaSet
  healthyNodes: string[]
}
