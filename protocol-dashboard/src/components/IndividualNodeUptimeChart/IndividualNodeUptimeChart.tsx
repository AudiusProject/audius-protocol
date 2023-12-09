import { TrackerChart } from 'components/TrackerChart'
import React from 'react'
import { useIndividualNodeUptime } from 'store/cache/analytics/hooks'
import { Bucket, MetricError } from 'store/cache/analytics/slice'
import type { DataObject } from 'components/TrackerChart'

type OwnProps = {
  node: string
}

type IndividualNodeUptimeChartProps = OwnProps

const IndividualNodeUptimeChart: React.FC<IndividualNodeUptimeChartProps> = ({
  node
}) => {
  let error, subtitle: string, data: DataObject[]
  const { uptime } = useIndividualNodeUptime(node, Bucket.DAY)
  if (uptime === MetricError.ERROR) {
    error = true
    data = []
  } else if (uptime?.uptime_percentage && uptime?.uptime_raw_data) {
    subtitle = `Uptime ${Math.round(uptime.uptime_percentage * 100) / 100}%`
    data = []
    for (const [bucket, up] of Object.entries(uptime.uptime_raw_data)) {
      data.push({
        // TODO add harmony and use harmony css vars
        color: up === 1 ? '#13c65a' : '#f9344c',
        // color: up === 1 ? 'var(--harmony-light-green)' : 'var(--harmony-red)',
        tooltip: new Date(bucket).toUTCString()
      })
    }
  }

  return (
    <TrackerChart
      title="Status"
      subtitle={subtitle}
      data={data}
      error={error}
    />
  )
}

export default IndividualNodeUptimeChart
