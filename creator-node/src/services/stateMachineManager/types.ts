import type Logger from 'bunyan'
import type { Queue } from 'bullmq'
import type {
  FetchCNodeEndpointToSpIdMapJobParams,
  FindReplicaSetUpdateJobParams,
  FindReplicaSetUpdatesJobReturnValue,
  FindSyncRequestsJobParams,
  FindSyncRequestsJobReturnValue,
  MonitorStateJobParams,
  MonitorStateJobReturnValue
} from './stateMonitoring/types'
import type {
  UpdateReplicaSetJobParams,
  IssueSyncRequestJobParams,
  IssueSyncRequestJobReturnValue,
  UpdateReplicaSetJobReturnValue,
  UpdateReplicaSetJobParamsWithoutEnabledReconfigModes
} from './stateReconciliation/types'
import type { TQUEUE_NAMES } from './stateMachineConstants'

export type QueueNameToQueueMap = Record<
  TQUEUE_NAMES,
  {
    queue: Queue
    maxWaitingJobs: number
  }
>

export type WalletsToSecondariesMapping = {
  [wallet: string]: string[]
}

/**
 * Job params (inputs)
 */

export type DecoratedJobParams<JobParams> = JobParams & {
  logger: Logger
  enqueuedBy?: string
}

export type AnyJobParams =
  | MonitorStateJobParams
  | FindSyncRequestsJobParams
  | FindReplicaSetUpdateJobParams
  | IssueSyncRequestJobParams
  | UpdateReplicaSetJobParams
  | FetchCNodeEndpointToSpIdMapJobParams
export type AnyDecoratedJobParams =
  | DecoratedJobParams<MonitorStateJobParams>
  | DecoratedJobParams<FindSyncRequestsJobParams>
  | DecoratedJobParams<FindReplicaSetUpdateJobParams>
  | DecoratedJobParams<IssueSyncRequestJobParams>
  | DecoratedJobParams<UpdateReplicaSetJobParams>
  | DecoratedJobParams<FetchCNodeEndpointToSpIdMapJobParams>

/**
 * Job return values (outputs)
 */
export type ParamsForJobsToEnqueue =
  | MonitorStateJobParams
  | FindSyncRequestsJobParams
  | FindReplicaSetUpdateJobParams
  | IssueSyncRequestJobParams
  | UpdateReplicaSetJobParamsWithoutEnabledReconfigModes
  | FetchCNodeEndpointToSpIdMapJobParams
export type JobsToEnqueue = Partial<
  Record<TQUEUE_NAMES, ParamsForJobsToEnqueue[]>
>
export type DecoratedJobReturnValue<JobReturnValue> = JobReturnValue & {
  jobsToEnqueue?: JobsToEnqueue
  metricsToRecord?: any
}
export type AnyDecoratedJobReturnValue =
  | DecoratedJobReturnValue<MonitorStateJobReturnValue>
  | DecoratedJobReturnValue<FindSyncRequestsJobReturnValue>
  | DecoratedJobReturnValue<FindReplicaSetUpdatesJobReturnValue>
  | DecoratedJobReturnValue<IssueSyncRequestJobReturnValue>
  | DecoratedJobReturnValue<UpdateReplicaSetJobReturnValue>
