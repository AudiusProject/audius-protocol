import type Logger from 'bunyan'
import type { Queue } from 'bullmq'
import type { FetchCNodeEndpointToSpIdMapJobParams } from './stateMonitoring/types'
import type {
  IssueSyncRequestJobParams,
  IssueSyncRequestJobReturnValue
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
  | IssueSyncRequestJobParams
  | FetchCNodeEndpointToSpIdMapJobParams
export type AnyDecoratedJobParams =
  | DecoratedJobParams<IssueSyncRequestJobParams>
  | DecoratedJobParams<FetchCNodeEndpointToSpIdMapJobParams>

/**
 * Job return values (outputs)
 */
export type ParamsForJobsToEnqueue =
  | IssueSyncRequestJobParams
  | FetchCNodeEndpointToSpIdMapJobParams
export type JobsToEnqueue = Partial<
  Record<TQUEUE_NAMES, ParamsForJobsToEnqueue[]>
>
export type DecoratedJobReturnValue<JobReturnValue> = JobReturnValue & {
  jobsToEnqueue?: JobsToEnqueue
  metricsToRecord?: any
}
export type AnyDecoratedJobReturnValue =
  DecoratedJobReturnValue<IssueSyncRequestJobReturnValue>
