import { APICallsInfoTooltip } from 'components/InfoTooltip/InfoTooltips'
import LineChart from 'components/LineChart'
import React, { useState } from 'react'
import { useApiCalls, useTrailingApiCalls } from 'store/cache/analytics/hooks'
import { Bucket, MetricError } from 'store/cache/analytics/slice'
import { datesToSkip } from 'utils/consts'
import { isMobile as getIsMobile } from 'utils/mobile'

type ApiCallsBucket = Bucket.MONTH | Bucket.WEEK | Bucket.ALL_TIME | Bucket.YEAR

const TotalApiCallsChart: React.FC = () => {
  const [bucket, setBucket] = useState<ApiCallsBucket>(Bucket.ALL_TIME)
  const isMobile = getIsMobile()

  const { apiCalls } = useApiCalls(bucket)
  const { apiCalls: trailingApiCalls } = useTrailingApiCalls(
    bucket === Bucket.ALL_TIME ? Bucket.MONTH : bucket
  )
  let topNumberError: boolean, topNumber: number
  if (trailingApiCalls === MetricError.ERROR) {
    topNumberError = true
    topNumber = null
  } else {
    topNumber = trailingApiCalls?.total_count ?? null
  }

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
        ?.map(a => a.total_count) ?? null

    if (bucket === Bucket.ALL_TIME) {
      topNumber = apiCalls
        ?.filter(a => !datesToSkip.has(a.timestamp))
        ?.reduce((acc, point) => {
          return acc + point.total_count
        }, 0)
    }
  }

  return (
    <LineChart
      topNumber={topNumber}
      size={isMobile ? 'default' : 'large'}
      title="API Calls"
      tooltipTitle="Calls"
      titleTooltipComponent={APICallsInfoTooltip}
      error={error}
      data={data}
      labels={labels}
      selection={bucket}
      options={[Bucket.ALL_TIME, Bucket.YEAR, Bucket.MONTH, Bucket.WEEK]}
      onSelectOption={(option: string) => setBucket(option as ApiCallsBucket)}
      showLeadingDay
    />
  )
}

export default TotalApiCallsChart
