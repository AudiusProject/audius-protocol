import React from 'react'

import Stat from 'components/Stat'
import { useTrailingApiCalls } from 'store/cache/analytics/hooks'
import { Bucket, MetricError } from 'store/cache/analytics/slice'
import { formatNumber } from 'utils/format'
import { TextProps } from '@audius/harmony'

type OwnProps = {}

type ApiCallsStatProps = OwnProps & TextProps

const ApiCallsStat: React.FC<ApiCallsStatProps> = textProps => {
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
      error={error}
      stat={stat !== null ? formatNumber(stat) : null}
      {...textProps}
    />
  )
}

export default ApiCallsStat
