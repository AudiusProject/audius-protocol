import React, { useState } from 'react'

import RadarChart from 'components/RadarChart'
import { useTrailingTopGenres } from 'store/cache/analytics/hooks'
import { Bucket, MetricError } from 'store/cache/analytics/slice'

type OwnProps = {}

type TopGenresChartProps = OwnProps

const TopGenresChart: React.FC<TopGenresChartProps> = () => {
  const [bucket, setBucket] = useState(Bucket.MONTH)

  const { topGenres } = useTrailingTopGenres(bucket)
  let error, labels, data
  if (topGenres === MetricError.ERROR) {
    error = true
    labels = []
    data = []
  } else {
    labels = topGenres ? Object.keys(topGenres) : null
    data = topGenres ? Object.values(topGenres) : null
  }
  return (
    <RadarChart
      title='Top Genres'
      data={data}
      labels={labels}
      error={error}
      selection={bucket}
      options={[Bucket.ALL_TIME, Bucket.MONTH, Bucket.WEEK]}
      onSelectOption={(option: string) => setBucket(option as Bucket)}
    />
  )
}

export default TopGenresChart
