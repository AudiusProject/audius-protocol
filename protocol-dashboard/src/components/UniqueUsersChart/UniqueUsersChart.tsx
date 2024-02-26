import LineChart from 'components/LineChart'
import React, { useState } from 'react'
import { useApiCalls } from 'store/cache/analytics/hooks'
import { Bucket, MetricError } from 'store/cache/analytics/slice'
import { useTrailingApiCalls } from 'store/cache/analytics/hooks'
import { datesToSkip } from 'utils/consts'

type OwnProps = {}

type UniqueUsersChartProps = OwnProps

type UniqueUsersBucket =
  | Bucket.MONTH
  | Bucket.WEEK
  | Bucket.ALL_TIME
  | Bucket.YEAR

const UniqueUsersChart: React.FC<UniqueUsersChartProps> = () => {
  const [bucket, setBucket] = useState<UniqueUsersBucket>(Bucket.MONTH)
  const { apiCalls: trailingApiCalls } = useTrailingApiCalls(
    bucket === Bucket.ALL_TIME ? Bucket.MONTH : bucket
  )
  let topNumber: number
  if (trailingApiCalls === MetricError.ERROR) {
    topNumber = null
  } else {
    topNumber = trailingApiCalls?.summed_unique_count ?? null
  }

  const { apiCalls } = useApiCalls(bucket)
  let error, labels, data
  if (apiCalls === MetricError.ERROR) {
    error = true
    labels = []
    data = []
  } else {
    labels =
      apiCalls
        ?.filter(a => !datesToSkip.has(a.timestamp))
        ?.map(a => new Date(a.timestamp).getTime() / 1000) ?? null
    data =
      apiCalls
        ?.filter(a => !datesToSkip.has(a.timestamp))
        ?.map(a => a.summed_unique_count) ?? null
  }
  return (
    <LineChart
      topNumber={topNumber}
      title="Unique Users"
      tooltipTitle="Users"
      data={data}
      labels={labels}
      selection={bucket}
      error={error}
      options={[Bucket.ALL_TIME, Bucket.YEAR, Bucket.MONTH, Bucket.WEEK]}
      onSelectOption={(option: string) =>
        setBucket(option as UniqueUsersBucket)
      }
      showLeadingDay
    />
  )
}

export default UniqueUsersChart
