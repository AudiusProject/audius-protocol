import LineChart from 'components/LineChart'
import { useTotalStaked as usedLiveTotalStakedAudio } from 'hooks/useTotalStaked'
import React, { useState } from 'react'
import { useTotalStaked } from 'store/cache/analytics/hooks'

import AudiusClient from 'services/Audius'
import { Bucket, MetricError } from 'store/cache/analytics/slice'
import { Status } from 'types'

const TotalStakedChart: React.FC = () => {
  const { totalStaked } = useTotalStaked(Bucket.YEAR)
  let error, labels, data, topNumber: string
  if (totalStaked === MetricError.ERROR) {
    error = true
    labels = []
    data = []
  } else {
    labels = totalStaked?.map(s => s.timestamp) ?? null
    data = totalStaked?.map(s => s.count) ?? null
  }

  const { status: trailingTotalStatus, total } = usedLiveTotalStakedAudio()
  if (total && trailingTotalStatus === Status.Success) {
    topNumber = AudiusClient.displayShortAud(total)
  }

  return (
    <LineChart
      topNumber={topNumber}
      title="Current Global Staked $AUDIO"
      error={error}
      data={data}
      labels={labels}
      selection={Bucket.YEAR}
    />
  )
}

export default TotalStakedChart
