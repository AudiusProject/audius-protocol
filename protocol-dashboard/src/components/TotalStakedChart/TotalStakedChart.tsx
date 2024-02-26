import React, { useState } from 'react'

import LineChart from 'components/LineChart'
import { useTotalStaked } from 'store/cache/analytics/hooks'
import { Bucket, MetricError } from 'store/cache/analytics/slice'

type OwnProps = {}

type TotalStakedChartProps = OwnProps

const TotalStakedChart: React.FC<TotalStakedChartProps> = () => {
  const [bucket, setBucket] = useState(Bucket.MONTH)

  const { totalStaked } = useTotalStaked(bucket)
  let error, labels, data
  if (totalStaked === MetricError.ERROR) {
    error = true
    labels = []
    data = []
  } else {
    labels = totalStaked?.map((s) => s.timestamp) ?? null
    data = totalStaked?.map((s) => s.count) ?? null
  }
  return (
    <LineChart
      title='Total Staked'
      error={error}
      data={data}
      labels={labels}
      selection={bucket}
      options={[Bucket.ALL_TIME, Bucket.MONTH, Bucket.WEEK]}
      onSelectOption={(option: string) => setBucket(option as Bucket)}
    />
  )
}

export default TotalStakedChart
