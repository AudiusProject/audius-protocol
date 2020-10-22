import RadarChart from 'components/RadarChart'
import React, { useState } from 'react'
import { useTrailingTopGenres } from 'store/cache/analytics/hooks'
import { Bucket } from 'store/cache/analytics/slice'

type OwnProps = {}

type TopGenresChartProps = OwnProps

const TopGenresChart: React.FC<TopGenresChartProps> = () => {
  const [bucket, setBucket] = useState(Bucket.MONTH)

  const { topGenres } = useTrailingTopGenres(bucket)
  const labels = topGenres ? Object.keys(topGenres) : null
  const data = topGenres ? Object.values(topGenres) : null
  return (
    <RadarChart
      title="Top Genres"
      data={data}
      labels={labels}
      selection={bucket}
      options={[Bucket.ALL_TIME, Bucket.MONTH, Bucket.WEEK]}
      onSelectOption={(option: string) => setBucket(option as Bucket)}
    />
  )
}

export default TopGenresChart
