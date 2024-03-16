import { PlaysInfoTooltip } from 'components/InfoTooltip/InfoTooltips'
import LineChart from 'components/LineChart'
import React, { useState } from 'react'
import { usePlays } from 'store/cache/analytics/hooks'
import { Bucket, MetricError } from 'store/cache/analytics/slice'

type OwnProps = {}

type PlaysChartProps = OwnProps

const PlaysChart: React.FC<PlaysChartProps> = () => {
  const [bucket, setBucket] = useState(Bucket.ALL_TIME)

  const { plays } = usePlays(bucket)
  let error, data, labels, topNumber: number
  if (plays === MetricError.ERROR) {
    error = true
    labels = []
    data = []
  } else {
    labels = plays?.map(p => p.timestamp) ?? null
    data = plays?.map(p => p.count) ?? null
    topNumber =
      plays == null
        ? null
        : plays.reduce((acc, p) => {
            return acc + p.count
          }, 0)
  }
  return (
    <LineChart
      topNumber={topNumber}
      title="Plays"
      titleTooltipComponent={PlaysInfoTooltip}
      data={data}
      labels={labels}
      selection={bucket}
      error={error}
      options={[Bucket.ALL_TIME, Bucket.YEAR, Bucket.MONTH, Bucket.WEEK]}
      onSelectOption={(option: string) => setBucket(option as Bucket)}
    />
  )
}

export default PlaysChart
