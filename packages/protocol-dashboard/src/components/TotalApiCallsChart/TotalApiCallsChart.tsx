import LineChart from 'components/LineChart'
import React, { useState } from 'react'
import { useApiCalls } from 'store/cache/analytics/hooks'
import { Bucket, MetricError } from 'store/cache/analytics/slice'

type OwnProps = {}

type TotalApiCallsChartProps = OwnProps

const TotalApiCallsChart: React.FC<TotalApiCallsChartProps> = props => {
  const [bucket, setBucket] = useState(Bucket.MONTH)

  const { apiCalls } = useApiCalls(bucket)
  let error, labels, data
  if (apiCalls === MetricError.ERROR) {
    error = true
    labels = []
    data = []
  } else {
    labels = apiCalls?.map(a => new Date(a.timestamp).getTime() / 1000) ?? null
    data = apiCalls?.map(a => a.total_count) ?? null
  }
  return (
    <LineChart
      title="Total API Calls"
      tooltipTitle="Calls"
      error={error}
      data={data}
      labels={labels}
      selection={bucket}
      options={[Bucket.ALL_TIME, Bucket.MONTH, Bucket.WEEK]}
      onSelectOption={(option: string) => setBucket(option as Bucket)}
      showLeadingDay
    />
  )
}

export default TotalApiCallsChart
