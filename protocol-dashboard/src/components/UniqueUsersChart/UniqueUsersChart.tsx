import React, { useState } from 'react'

import LineChart from 'components/LineChart'
import { useApiCalls } from 'store/cache/analytics/hooks'
import { Bucket, MetricError } from 'store/cache/analytics/slice'
import { datesToSkip } from 'utils/consts'

type OwnProps = {}

type UniqueUsersChartProps = OwnProps

const UniqueUsersChart: React.FC<UniqueUsersChartProps> = () => {
  const [bucket, setBucket] = useState(Bucket.MONTH)

  const { apiCalls } = useApiCalls(bucket)
  let error, labels, data
  if (apiCalls === MetricError.ERROR) {
    error = true
    labels = []
    data = []
  } else {
    labels =
      apiCalls
        ?.filter((a) => !datesToSkip.has(a.timestamp))
        ?.map((a) => new Date(a.timestamp).getTime() / 1000) ?? null
    data =
      apiCalls
        ?.filter((a) => !datesToSkip.has(a.timestamp))
        ?.map((a) => a.summed_unique_count) ?? null
  }
  return (
    <LineChart
      title='Unique Users'
      tooltipTitle='Users'
      data={data}
      labels={labels}
      selection={bucket}
      error={error}
      options={[Bucket.ALL_TIME, Bucket.MONTH, Bucket.WEEK]}
      onSelectOption={(option: string) => setBucket(option as Bucket)}
      showLeadingDay
    />
  )
}

export default UniqueUsersChart
