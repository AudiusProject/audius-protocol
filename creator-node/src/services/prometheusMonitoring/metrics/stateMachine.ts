import type { MetricTypeAndConfig } from '../types'

import { Histogram } from 'prom-client'

import {
  QUEUE_NAMES as STATE_MACHINE_JOB_NAMES,
  UpdateReplicaSetJobResult
} from '../../stateMachineManager/stateMachineConstants'

type StateMachineJobNameKey = keyof typeof STATE_MACHINE_JOB_NAMES
type StateMachineJobNameValue =
  typeof STATE_MACHINE_JOB_NAMES[StateMachineJobNameKey]

function _getMetricLabels(jobName: StateMachineJobNameValue) {
  if (jobName in METRIC_LABELS) {
    const labels = METRIC_LABELS[jobName as keyof typeof METRIC_LABELS]
    return labels
  } else return {} as { [labelName: string]: readonly string[] }
}

const METRIC_LABELS = {
  [STATE_MACHINE_JOB_NAMES.UPDATE_REPLICA_SET]: {
    // Whether or not the user's replica set was updated during this job
    issuedReconfig: ['false', 'true'],
    // The type of reconfig, if any, that happened during this job (or that would happen if reconfigs were enabled)
    reconfigType: [
      'one_secondary', // Only one secondary was replaced in the user's replica set
      'multiple_secondaries', // Both secondaries were replaced in the user's replica set
      'primary_and_or_secondaries', // A secondary gets promoted to new primary and one or both secondaries get replaced with new random nodes
      'null' // No change was made to the user's replica set because the job short-circuited before selecting or was unable to select new node(s)
    ],
    // https://stackoverflow.com/questions/18111657/how-to-get-names-of-enum-entries
    result: Object.values(UpdateReplicaSetJobResult).filter(
      (value) => typeof value === 'string'
    ) as string[]
  }
}
export default {
  // Make a histogram for each job in the state machine queues
  ...(Object.fromEntries(
    Object.values(STATE_MACHINE_JOB_NAMES).map((jobName) => [
      [`STATE_MACHINE_${jobName}_JOB_DURATION_SECONDS_HISTOGRAM`],
      {
        metricType: Histogram,
        metricLabels: {
          // Whether the job completed (including with a caught error) or quit unexpectedly
          uncaughtError: ['false', 'true'],
          // Label names, if any, that are specific to this job type
          ..._getMetricLabels(jobName)
        } as { readonly [labelName: string]: readonly string[] },
        metricConfig: {
          help: `Duration in seconds for a ${jobName} job to complete`,
          buckets: [1, 5, 10, 30, 60, 120], // 1 second to 2 minutes
          aggregator: 'average'
        }
      } as MetricTypeAndConfig // TODO: See if we can get more specific here like as const to bubble up the strings
    ])
  ) as Record<
    `STATE_MACHINE_${StateMachineJobNameValue}_JOB_DURATION_SECONDS_HISTOGRAM`,
    MetricTypeAndConfig
  >)
}
