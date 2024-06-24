import React, { useState } from 'react'

import { UniqueUsersInfoTooltip } from 'components/InfoTooltip/InfoTooltips'
import LineChart from 'components/LineChart'
import { useApiCalls } from 'store/cache/analytics/hooks'
import { Bucket, MetricError } from 'store/cache/analytics/slice'
import { datesToSkip } from 'utils/consts'

type OwnProps = {}

type UniqueUsersChartProps = OwnProps

type UniqueUsersBucket =
  | Bucket.MONTH
  | Bucket.WEEK
  | Bucket.ALL_TIME
  | Bucket.YEAR

const messages = {
  monthlyTitle: 'Monthly',
  dailyTitle: 'Daily'
}

const BUCKET_TO_TOPLINE_LABEL = {
  [Bucket.ALL_TIME]: messages.monthlyTitle,
  [Bucket.YEAR]: messages.monthlyTitle,
  [Bucket.MONTH]: messages.dailyTitle,
  [Bucket.WEEK]: messages.dailyTitle
}

const UniqueUsersChart: React.FC<UniqueUsersChartProps> = () => {
  const [bucket, setBucket] = useState<UniqueUsersBucket>(Bucket.ALL_TIME)

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
      titleTooltipComponent={UniqueUsersInfoTooltip}
      title={`Unique ${BUCKET_TO_TOPLINE_LABEL[bucket]} Users`}
      topNumber={data ? data[data.length - 1] : undefined}
      tooltipTitle='Users'
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
