import LineChart from 'components/LineChart'
import React, { useState } from 'react'
import { useTotalStaked } from 'store/cache/analytics/hooks'
import { useTotalStaked as usedLiveTotalStakedAudio } from 'hooks/useTotalStaked'

import { Bucket, MetricError } from 'store/cache/analytics/slice'
import AudiusClient from 'services/Audius'
import { Status } from 'types'
import { formatNumber } from 'utils/format'

type OwnProps = {}

type TotalStakedChartProps = OwnProps

const TotalStakedChart: React.FC<TotalStakedChartProps> = () => {
  const [bucket, setBucket] = useState(Bucket.YEAR)

  const { totalStaked } = useTotalStaked(bucket)
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
      title="Global Staked $AUDIO"
      error={error}
      data={data}
      labels={labels}
      selection={bucket}
      options={[Bucket.ALL_TIME, Bucket.YEAR, Bucket.MONTH, Bucket.WEEK]}
      onSelectOption={(option: string) => setBucket(option as Bucket)}
    />
  )
}

export default TotalStakedChart
