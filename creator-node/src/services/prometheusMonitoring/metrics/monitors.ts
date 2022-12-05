import type { MetricTypeAndConfig } from '../types'

import { Gauge } from 'prom-client'

import { MONITORS } from '../../../monitors/monitors'

// Add all integer monitors as prometheus metrics
type MonitorKey = keyof typeof MONITORS
const monitorKeys = Object.keys(MONITORS) as MonitorKey[]
const monitorEntries: [MonitorKey, typeof MONITORS[MonitorKey]][] = monitorKeys
  .filter((key) => MONITORS[key]?.type === 'int')
  .map((key) => [key, MONITORS[key]])
type PromMonitorKey = keyof typeof PROMETHEUS_MONITORS

export const PROMETHEUS_MONITORS: Record<
  MonitorKey,
  typeof MONITORS[MonitorKey]
> = Object.fromEntries(monitorEntries)
export default {
  // Add a gauge for each monitor
  ...(Object.fromEntries(
    Object.keys<keyof typeof PROMETHEUS_MONITORS>(PROMETHEUS_MONITORS).map(
      (monitor) => [
        [`MONITOR_${monitor}`],
        {
          metricType: Gauge,
          metricLabels: {} as { [labelName: string]: readonly string[] },
          metricConfig: {
            help: `Record monitor: ${monitor}`,
            aggregator: 'max'
          }
        } as MetricTypeAndConfig // TODO: See if we can get more specific here like as const to bubble up the strings
      ]
    )
  ) as Record<`MONITOR_${PromMonitorKey}`, MetricTypeAndConfig>)
}
