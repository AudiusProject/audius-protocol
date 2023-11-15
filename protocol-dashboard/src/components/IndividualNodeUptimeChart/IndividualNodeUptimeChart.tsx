import LineChart from 'components/LineChart'
import React from 'react'
import { useIndividualNodeUptime } from 'store/cache/analytics/hooks'
import { Bucket, MetricError } from 'store/cache/analytics/slice'

type OwnProps = {
  node: string,
}

type IndividualNodeUptimeChartProps = OwnProps

const IndividualNodeUptimeChart: React.FC<IndividualNodeUptimeChartProps> = ({
  node,
}) => {
  let error, labels: string[], data: number[]
  const { uptime } = useIndividualNodeUptime(node, Bucket.DAY)
  if (uptime === MetricError.ERROR) {
    error = true
    labels = []
    data = []
  } else if (uptime) {
    labels = Object.keys(uptime).map(u => (new Date(u).getTime() / 1000).toString()) ?? null
    data = Object.values(uptime) ?? null
  }

  return (
    <LineChart
      title="Uptime"
      tooltipTitle="Uptime"
      error={error}
      data={data}
      labels={labels}
      selection={Bucket.DAY}
      showLeadingDay
    />
  )
}

export default IndividualNodeUptimeChart
