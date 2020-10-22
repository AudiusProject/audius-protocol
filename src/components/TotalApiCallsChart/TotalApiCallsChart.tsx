import LineChart from 'components/LineChart'
import React, { useState } from 'react'
import { useApiCalls } from 'store/cache/analytics/hooks'
import { Bucket } from 'store/cache/analytics/slice'

type OwnProps = {}

type TotalApiCallsChartProps = OwnProps

const TotalApiCallsChart: React.FC<TotalApiCallsChartProps> = props => {
  const [bucket, setBucket] = useState(Bucket.MONTH)

  const { apiCalls } = useApiCalls(bucket)
  const labels = apiCalls?.map(a => a.timestamp) ?? null
  const data = apiCalls?.map(a => a.count) ?? null
  return (
    <LineChart
      title="Total API Calls"
      tooltipTitle="Calls"
      data={data}
      labels={labels}
      selection={bucket}
      options={[Bucket.ALL_TIME, Bucket.MONTH, Bucket.WEEK]}
      onSelectOption={(option: string) => setBucket(option as Bucket)}
    />
  )
}

export default TotalApiCallsChart
