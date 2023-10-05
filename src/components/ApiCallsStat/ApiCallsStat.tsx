import React from 'react'

import Stat from 'components/Stat'
import { useTrailingApiCalls } from 'store/cache/analytics/hooks'
import { Bucket, MetricError } from 'store/cache/analytics/slice'
import { formatNumber } from 'utils/format'

const messages = {
  label: 'API CALLS THIS MONTH'
}

type OwnProps = {}

type ApiCallsStatProps = OwnProps

const ApiCallsStat: React.FC<ApiCallsStatProps> = () => {
  const { apiCalls } = useTrailingApiCalls(Bucket.MONTH)
  let error, stat
  if (apiCalls === MetricError.ERROR) {
    error = true
    stat = null
  } else {
    stat = apiCalls?.total_count ?? null
  }
  return (
    <Stat
      label={messages.label}
      error={error}
      stat={stat !== null ? formatNumber(stat) : null}
    />
  )
}

export default ApiCallsStat
