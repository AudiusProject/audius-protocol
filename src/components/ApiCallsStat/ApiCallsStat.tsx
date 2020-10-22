import React from 'react'

import Stat from 'components/Stat'
import { useTrailingApiCalls } from 'store/cache/analytics/hooks'
import { Bucket } from 'store/cache/analytics/slice'
import { formatNumber } from 'utils/format'

const messages = {
  label: 'API CALLS THIS MONTH'
}

type OwnProps = {}

type ApiCallsStatProps = OwnProps

const ApiCallsStat: React.FC<ApiCallsStatProps> = (
  props: ApiCallsStatProps
) => {
  const { apiCalls } = useTrailingApiCalls(Bucket.MONTH)
  const stat = apiCalls?.count ?? null
  return (
    <Stat
      label={messages.label}
      stat={stat !== null ? formatNumber(stat) : null}
    />
  )
}

export default ApiCallsStat
