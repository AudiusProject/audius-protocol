import React from 'react'

import { TextProps } from '@audius/harmony'

import Stat from 'components/Stat'
import { useApiCalls } from 'store/cache/analytics/hooks'
import { Bucket, MetricError } from 'store/cache/analytics/slice'
import { formatNumber } from 'utils/format'

type OwnProps = {}

type UniqueUsersStatProps = OwnProps & TextProps

const UniqueUsersStat: React.FC<UniqueUsersStatProps> = (textProps) => {
  const { apiCalls } = useApiCalls(Bucket.ALL_TIME)

  let error, stat
  if (apiCalls === MetricError.ERROR) {
    error = true
    stat = null
  } else {
    stat = apiCalls?.[apiCalls.length - 1].summed_unique_count ?? null
  }
  return (
    <Stat
      error={error}
      stat={stat !== null ? formatNumber(stat) : null}
      {...textProps}
    />
  )
}

export default UniqueUsersStat
