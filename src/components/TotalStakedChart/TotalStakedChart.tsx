import LineChart from 'components/LineChart'
import React, { useState } from 'react'
import { useTotalStaked } from 'store/cache/analytics/hooks'
import { Bucket } from 'store/cache/analytics/slice'

type OwnProps = {}

type TotalStakedChartProps = OwnProps

const TotalStakedChart: React.FC<TotalStakedChartProps> = () => {
  const [bucket, setBucket] = useState(Bucket.MONTH)

  const { totalStaked } = useTotalStaked(bucket)
  const labels = totalStaked?.map(s => s.timestamp) ?? null
  const data = totalStaked?.map(s => s.count) ?? null
  return (
    <LineChart
      title="Total Staked"
      data={data}
      labels={labels}
      selection={bucket}
      options={[Bucket.ALL_TIME, Bucket.MONTH, Bucket.WEEK]}
      onSelectOption={(option: string) => setBucket(option as Bucket)}
    />
  )
}

export default TotalStakedChart
