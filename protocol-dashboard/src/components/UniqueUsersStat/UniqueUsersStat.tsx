import styles from '../styles/UniqueUsersStat.module.css'
import React from 'react'

import Stat from 'components/Stat'
import { TextProps } from '@audius/harmony'
import { useTrailingApiCalls } from 'store/cache/analytics/hooks'
import { Bucket, MetricError } from 'store/cache/analytics/slice'
import { formatNumber } from 'utils/format'

type OwnProps = {}

type UniqueUsersStatProps = OwnProps & TextProps

const UniqueUsersStat: React.FC<UniqueUsersStatProps> = textProps => {
  const { apiCalls } = useTrailingApiCalls(Bucket.MONTH)
  let error, stat
  if (apiCalls === MetricError.ERROR) {
    error = true
    stat = null
  } else {
    stat = apiCalls?.summed_unique_count ?? null
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
