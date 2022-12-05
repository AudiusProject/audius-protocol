import type {
  MetricRecordType,
  MetricName
} from '../prometheusMonitoring/prometheus.constants'

import {
  METRIC_RECORD_TYPE,
  METRIC_NAMES,
  METRIC_LABELS
} from '../prometheusMonitoring/prometheus.constants'

/**
 * Returns an object that can be returned from any state machine job to record a histogram metric being observed.
 * Example: to call responseTimeHistogram.observe({ code: '200' }, 1000), you would call this function with:
 * makeHistogramToRecord('response_time', 1000, { code: '200' })
 * @param {MetricName} metricName the name of the metric from prometheus.constants
 * @param {number} metricValue the value to observe
 * @param {Record<string, string>} [metricLabels] the optional mapping of metric label name => metric label value
 */
export const makeHistogramToRecord = (
  metricName: MetricName,
  metricValue: number,
  metricLabels: { readonly [label: string]: string } = {}
) => {
  return makeMetricToRecord(
    METRIC_RECORD_TYPE.HISTOGRAM_OBSERVE,
    metricName,
    metricValue,
    metricLabels
  )
}

/**
 * Returns an object that can be returned from any state machine job to record an increase in a gauge metric.
 * Example: to call testGuage.inc({ status: 'success' }, 1), you would call this function with:
 * makeGaugeIncToRecord('test_gauge', 1, { status: 'success' })
 * @param {MetricName} metricName the name of the metric from prometheus.constants
 * @param {number} incBy the metric value to increment by in Metric#inc for the prometheus gauge
 * @param {string} [metricLabels] the optional mapping of metric label name => metric label value
 */
export const makeGaugeIncToRecord = (
  metricName: MetricName,
  incBy: number,
  metricLabels: { readonly [label: string]: string } = {}
) => {
  return makeMetricToRecord(
    METRIC_RECORD_TYPE.GAUGE_INC,
    metricName,
    incBy,
    metricLabels
  )
}

/**
 * Returns an object that can be returned from any state machine job to record setting a gauge metric.
 * Example: to call testGuage.set({ status: 'success' }, 1), you would call this function with:
 * makeGaugeSetToRecord('test_gauge', 1, { status: 'success' })
 * @param {MetricName} metricName the name of the metric from prometheus.constants
 * @param {number} valueToSet the metric value to set Metric#set for the prometheus gauge
 * @param {string} [metricLabels] the optional mapping of metric label name => metric label value
 */
export const makeGaugeSetToRecord = (
  metricName: MetricName,
  valueToSet: number,
  metricLabels: { readonly [label: string]: string } = {}
) => {
  return makeMetricToRecord(
    METRIC_RECORD_TYPE.GAUGE_SET,
    metricName,
    valueToSet,
    metricLabels
  )
}

/**
 * Returns an object that can be returned from any state machine job to record a change in a metric.
 * Validates the params to make sure the metric is valid.
 * @param {MetricRecordType} metricType the type of metric being recorded
 * @param {MetricName} metricName the name of the metric from prometheus.constants
 * @param {number} metricValue the value to observe
 * @param {string} [metricLabels] the optional mapping of metric label name => metric label value
 */
export const makeMetricToRecord = (
  metricType: MetricRecordType,
  metricName: MetricName,
  metricValue: number,
  metricLabels: { readonly [label: string]: string } = {}
) => {
  if (!Object.values(METRIC_RECORD_TYPE).includes(metricType)) {
    throw new Error(
      `Invalid metricType. metricType=${metricType} metricName=${metricName} metricValue=${metricValue} metricLabels=${JSON.stringify(
        metricLabels
      )}`
    )
  }
  if (!Object.values(METRIC_NAMES).includes(metricName)) {
    throw new Error(
      `Invalid metricName. metricType=${metricType} metricName=${metricName} metricValue=${metricValue} metricLabels=${JSON.stringify(
        metricLabels
      )}`
    )
  }
  if (typeof metricValue !== 'number') {
    throw new Error(
      `Invalid non-numerical metricValue. metricType=${metricType} metricName=${metricName} metricValue=${metricValue} metricLabels=${JSON.stringify(
        metricLabels
      )}`
    )
  }
  const labelNames = Object.keys<keyof typeof METRIC_LABELS>(
    METRIC_LABELS[metricName]
  )
  for (const [labelName, labelValue] of Object.entries(metricLabels)) {
    if (!labelNames?.includes(labelName as typeof labelNames[number])) {
      throw new Error(
        `Metric label has invalid name: '${labelName}'. metricType=${metricType} metricName=${metricName} metricValue=${metricValue} metricLabels=${JSON.stringify(
          metricLabels
        )}`
      )
    }
    const labelValues = (
      METRIC_LABELS[metricName] as { [labelName: string]: string[] }
    )?.[labelName]
    if (!labelValues?.includes(labelValue) && labelValues?.length !== 0) {
      throw new Error(
        `Metric label has invalid value: '${labelValue}'. metricType=${metricType} metricName=${metricName} metricValue=${metricValue} metricLabels=${JSON.stringify(
          metricLabels
        )}`
      )
    }
  }

  const metric = {
    metricName,
    metricType,
    metricValue,
    metricLabels
  }
  return metric
}

module.exports = {
  makeHistogramToRecord,
  makeGaugeIncToRecord,
  makeGaugeSetToRecord
}
