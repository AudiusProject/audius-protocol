import React from 'react'

import Stat from 'components/Stat'
import { useTrailingApiCalls } from 'store/cache/analytics/hooks'
import { Bucket } from 'store/cache/analytics/slice'
import { formatNumber } from 'utils/format'

const messages = {
  label: 'UNIQUE USERS THIS MONTH'
}

type OwnProps = {}

type UniqueUsersStatProps = OwnProps

const UniqueUsersStat: React.FC<UniqueUsersStatProps> = (
  props: UniqueUsersStatProps
) => {
  const { apiCalls } = useTrailingApiCalls(Bucket.MONTH)
  const stat = apiCalls?.unique_count ?? null
  return (
    <Stat
      label={messages.label}
      stat={stat !== null ? formatNumber(stat) : null}
    />
  )
}

export default UniqueUsersStat
