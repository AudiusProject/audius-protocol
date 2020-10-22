import LineChart from 'components/LineChart'
import React, { useState } from 'react'
import { useApiCalls } from 'store/cache/analytics/hooks'
import { Bucket } from 'store/cache/analytics/slice'

type OwnProps = {}

type TotalApiCallsChartProps = OwnProps

const TotalApiCallsChart: React.FC<TotalApiCallsChartProps> = () => {
  const [bucket, setBucket] = useState(Bucket.MONTH)

  const { apiCalls } = useApiCalls(bucket)
  const labels = apiCalls?.map(a => a.timestamp) ?? null
  const data = apiCalls?.map(a => a.unique_count || 0) ?? null
  return (
    <LineChart
      title="Unique Users"
      tooltipTitle="Users"
      data={data}
      labels={labels}
      selection={bucket}
      options={[Bucket.ALL_TIME, Bucket.MONTH, Bucket.WEEK]}
      onSelectOption={(option: string) => setBucket(option as Bucket)}
    />
  )
}

export default TotalApiCallsChart
