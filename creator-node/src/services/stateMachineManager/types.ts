import type Logger from 'bunyan'
import type {
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

import { Queue } from 'bull'

export type QueueNameToQueueMap = Record<TQUEUE_NAMES, Queue>

export type WalletsToSecondariesMapping = {
  [wallet: string]: string[]
}

/**
 * Job params (inputs)
 */

export type DecoratedJobParams<JobParams> = JobParams & { logger: Logger }

export type AnyJobParams =
  | MonitorStateJobParams
  | FindSyncRequestsJobParams
  | FindReplicaSetUpdateJobParams
  | IssueSyncRequestJobParams
  | UpdateReplicaSetJobParams
export type AnyDecoratedJobParams =
  | DecoratedJobParams<MonitorStateJobParams>
  | DecoratedJobParams<FindSyncRequestsJobParams>
  | DecoratedJobParams<FindReplicaSetUpdateJobParams>
  | DecoratedJobParams<IssueSyncRequestJobParams>
  | DecoratedJobParams<UpdateReplicaSetJobParams>

/**
 * Job return values (outputs)
 */
export type ParamsForJobsToEnqueue =
  | MonitorStateJobParams
  | FindSyncRequestsJobParams
  | FindReplicaSetUpdateJobParams
  | IssueSyncRequestJobParams
  | UpdateReplicaSetJobParamsWithoutEnabledReconfigModes
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
