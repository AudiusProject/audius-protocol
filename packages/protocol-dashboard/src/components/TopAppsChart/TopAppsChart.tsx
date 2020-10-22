import BarChart from 'components/BarChart'
import React, { useState } from 'react'
import { useTopApps } from 'store/cache/analytics/hooks'
import { Bucket } from 'store/cache/analytics/slice'

type OwnProps = {}

type TopAppsChartProps = OwnProps

const TopAppsChart: React.FC<TopAppsChartProps> = () => {
  const [bucket, setBucket] = useState(Bucket.MONTH)

  const { topApps } = useTopApps(bucket)
  const labels = topApps ? Object.keys(topApps) : null
  const data = topApps ? Object.values(topApps) : null
  return (
    <BarChart
      title="Top Apps"
      column1="apps"
      column2="requests"
      data={data}
      labels={labels}
      selection={bucket}
      options={[Bucket.ALL_TIME, Bucket.MONTH, Bucket.WEEK]}
      onSelectOption={(option: string) => setBucket(option as Bucket)}
    />
  )
}

export default TopAppsChart
