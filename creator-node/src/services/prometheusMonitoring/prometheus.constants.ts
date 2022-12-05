import { lowerCase, mapValues } from 'lodash'

import STATE_MACHINE_METRICS from './metrics/stateMachine'
import PROM_MONITOR_METRICS, { PROMETHEUS_MONITORS } from './metrics/monitors'
import SYNC_QUEUE_JOBS_TOTAL_GAUGE from './metrics/syncQueueJobsTotal'
import ISSUE_SYNC_REQUEST_DURATION_SECONDS_HISTOGRAM from './metrics/issueSyncRequest'
import FIND_SYNC_REQUEST_COUNTS_GAUGE from './metrics/findSyncRequests'
import WRITE_QUORUM_DURATION_SECONDS_HISTOGRAM from './metrics/writeQuorum'
import SECONDARY_SYNC_FROM_PRIMARY_DURATION_SECONDS_HISTOGRAM from './metrics/secondarySyncFromPrimary'
import JOBS_ACTIVE_TOTAL_GAUGE from './metrics/jobsActiveTotal'
import JOBS_WAITING_TOTAL_GAUGE from './metrics/jobsWaitingTotal'
import JOBS_COMPLETED_TOTAL_GAUGE from './metrics/jobsCompletedTotal'
import JOBS_FAILED_TOTAL_GAUGE from './metrics/jobsFailedTotal'
import JOBS_DELAYED_TOTAL_GAUGE from './metrics/jobsDelayedTotal'
import JOBS_DURATION_SECONDS_HISTOGRAM from './metrics/jobsDuration'
import JOBS_WAITING_DURATION_SECONDS_HISTOGRAM from './metrics/jobsWaitingDuration'
import JOBS_ATTEMPTS_HISTOGRAM from './metrics/jobAttempts'
import RECOVER_ORPHANED_DATA_WALLET_COUNTS_GAUGE from './metrics/recoverOrphanedDataWalletCounts'
import RECOVER_ORPHANED_DATA_SYNC_COUNTS_GAUGE from './metrics/recoverOrphanedDataSyncCounts'
import STORAGE_PATH_SIZE_BYTES from './metrics/storagePathSize'
import FILES_MIGRATED_FROM_LEGACY_PATH_GAUGE from './metrics/filesMigratedFromLegacyPath'
import FILES_MIGRATED_FROM_CUSTOM_PATH_GAUGE from './metrics/filesMigratedFromCustomPath'

/**
 * For explanation of METRICS, and instructions on how to add a new metric, please see `prometheusMonitoring/README.md`
 */

// We add a namespace prefix to differentiate internal metrics from those exported by different exporters from the same host
export const NAMESPACE_PREFIX = 'audius_cn'

// The interval at which to poll the bull queue
export const QUEUE_INTERVAL = 1_000

export const ALL_METRICS = {
  SYNC_QUEUE_JOBS_TOTAL_GAUGE,
  ISSUE_SYNC_REQUEST_DURATION_SECONDS_HISTOGRAM,
  FIND_SYNC_REQUEST_COUNTS_GAUGE,
  WRITE_QUORUM_DURATION_SECONDS_HISTOGRAM,
  SECONDARY_SYNC_FROM_PRIMARY_DURATION_SECONDS_HISTOGRAM,
  JOBS_ACTIVE_TOTAL_GAUGE,
  JOBS_WAITING_TOTAL_GAUGE,
  JOBS_COMPLETED_TOTAL_GAUGE,
  JOBS_FAILED_TOTAL_GAUGE,
  JOBS_DELAYED_TOTAL_GAUGE,
  JOBS_DURATION_SECONDS_HISTOGRAM,
  JOBS_WAITING_DURATION_SECONDS_HISTOGRAM,
  JOBS_ATTEMPTS_HISTOGRAM,
  RECOVER_ORPHANED_DATA_WALLET_COUNTS_GAUGE,
  RECOVER_ORPHANED_DATA_SYNC_COUNTS_GAUGE,
  STORAGE_PATH_SIZE_BYTES,
  FILES_MIGRATED_FROM_LEGACY_PATH_GAUGE,
  FILES_MIGRATED_FROM_CUSTOM_PATH_GAUGE,
  ...STATE_MACHINE_METRICS,
  ...PROM_MONITOR_METRICS
} as const

// Create a mapping of each metric key to its name (its name is just the lowercase of key)
function _makeMetricNames<
  K extends keyof typeof ALL_METRICS,
  V extends typeof ALL_METRICS[keyof typeof ALL_METRICS],
  O extends {
    readonly [P in K]: V
  }
>(
  obj: O
): {
  readonly [P in K]: Lowercase<P>
} {
  const mappedObj: {
    [key: string]: string
  } = {}

  for (const key of Object.keys<K>(obj)) {
    mappedObj[key] = lowerCase(key) as Lowercase<K>
  }

  return mappedObj as {
    readonly [P in K]: Lowercase<P>
  }
}
export const METRIC_NAMES = _makeMetricNames(ALL_METRICS)
export type MetricNameKey = keyof typeof METRIC_NAMES
export type MetricName = typeof METRIC_NAMES[MetricNameKey]

// Create a mapping of each metric name to its labels
// const metricNameKeys = Object.keys<keyof typeof ALL_METRICS>(ALL_METRICS)
// const metricLabelEntries: [
//   MetricName,
//   { readonly [label: string]: readonly any[] } // TODO: Narrower?
// ][] = metricNameKeys.map((metricNameKey) => [
//   lowerCase(metricNameKey) as MetricName,
//   ALL_METRICS[metricNameKey].metricLabels // TODO: Narrower?
// ])
// export const METRIC_LABELS1: Partial<
//   Record<MetricName, { [label: string]: any[] }> // TODO: Narrower?
// > = Object.fromEntries(metricLabelEntries)
// function _makeMetricLabels<
//   K extends keyof typeof ALL_METRICS,
//   K2 extends Lowercase<K>,
//   L extends { readonly [labelName: string]: readonly any[] },
//   O extends {
//     readonly [P in K]: { readonly metricLabels: L }
//   }
// >(
//   obj: O
// ): {
//   readonly [P in K2]: L
// } {
//   const mappedObj: {
//     [key: string]: any
//   } = {}

//   for (const key of Object.keys<K>(obj)) {
//     mappedObj[lowerCase(key)] = obj[key].metricLabels as L
//   }

//   return mappedObj as {
//     readonly [P in K2]: L
//   }
// }
// export const METRIC_LABELS1 = _makeMetricLabels(ALL_METRICS)
export const METRIC_LABELS_BY_KEY = mapValues(
  ALL_METRICS,
  (metric) => metric.metricLabels
)
function _makeMetricLabels<
  K extends keyof typeof METRIC_LABELS_BY_KEY,
  K2 extends Lowercase<K>,
  V extends typeof METRIC_LABELS_BY_KEY[keyof typeof METRIC_LABELS_BY_KEY],
  O extends {
    [P in K]: V
  }
>(
  obj: O
): {
  readonly [P in K2]: V
} {
  const mappedObj: {
    [key: string]: V
  } = {}

  for (const key of Object.keys<K>(obj)) {
    mappedObj[lowerCase(key)] = obj[key]
  }

  return mappedObj as {
    [P in K2]: V
  }
}
export const METRIC_LABELS = _makeMetricLabels(METRIC_LABELS_BY_KEY)

// Types for recording a metric value
export const METRIC_RECORD_TYPE = {
  GAUGE_INC: 'GAUGE_INC',
  GAUGE_SET: 'GAUGE_SET',
  HISTOGRAM_OBSERVE: 'HISTOGRAM_OBSERVE'
} as const
type MetricRecordTypeKey = keyof typeof METRIC_RECORD_TYPE
export type MetricRecordType = typeof METRIC_RECORD_TYPE[MetricRecordTypeKey]

module.exports = {
  ALL_METRICS,
  PROMETHEUS_MONITORS,
  NAMESPACE_PREFIX,
  METRIC_NAMES,
  // METRIC_LABELS,
  METRIC_RECORD_TYPE,
  // METRICS,
  QUEUE_INTERVAL
}
