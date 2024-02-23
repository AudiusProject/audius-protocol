import React, { useState } from 'react'

import LineChart from 'components/LineChart'
import { usePlays } from 'store/cache/analytics/hooks'
import { Bucket, MetricError } from 'store/cache/analytics/slice'

type OwnProps = {}

type PlaysChartProps = OwnProps

const PlaysChart: React.FC<PlaysChartProps> = () => {
  const [bucket, setBucket] = useState(Bucket.MONTH)

  const { plays } = usePlays(bucket)
  let error, data, labels
  if (plays === MetricError.ERROR) {
    error = true
    labels = []
    data = []
  } else {
    labels = plays?.map((p) => p.timestamp) ?? null
    data = plays?.map((p) => p.count) ?? null
  }
  return (
    <LineChart
      title='Plays'
      data={data}
      labels={labels}
      selection={bucket}
      error={error}
      options={[Bucket.ALL_TIME, Bucket.MONTH, Bucket.WEEK]}
      onSelectOption={(option: string) => setBucket(option as Bucket)}
    />
  )
}

export default PlaysChart
