import LineChart from 'components/LineChart'
import React, { useState } from 'react'
import { usePlays } from 'store/cache/analytics/hooks'
import { Bucket } from 'store/cache/analytics/slice'

type OwnProps = {}

type PlaysChartProps = OwnProps

const PlaysChart: React.FC<PlaysChartProps> = () => {
  const [bucket, setBucket] = useState(Bucket.MONTH)

  const { plays } = usePlays(bucket)
  const labels = plays?.map(p => p.timestamp) ?? null
  const data = plays?.map(p => p.count) ?? null
  return (
    <LineChart
      title="Plays"
      data={data}
      labels={labels}
      selection={bucket}
      options={[Bucket.ALL_TIME, Bucket.MONTH, Bucket.WEEK]}
      onSelectOption={(option: string) => setBucket(option as Bucket)}
    />
  )
}

export default PlaysChart
