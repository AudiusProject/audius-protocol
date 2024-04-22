import React, { useState } from 'react'

import { UniqueUsersInfoTooltip } from 'components/InfoTooltip/InfoTooltips'
import LineChart from 'components/LineChart'
import { useIndividualServiceApiCalls } from 'store/cache/analytics/hooks'
import { Bucket, MetricError } from 'store/cache/analytics/slice'

type OwnProps = {
  node: string
}

type IndividualServiceUniqueUsersChartProps = OwnProps

const IndividualServiceUniqueUsersChart: React.FC<
  IndividualServiceUniqueUsersChartProps
> = ({ node }) => {
  const [bucket, setBucket] = useState(Bucket.MONTH)

  const { apiCalls } = useIndividualServiceApiCalls(node, bucket)
  let error, labels, data
  if (apiCalls === MetricError.ERROR) {
    error = true
    labels = []
    data = []
  } else {
    labels =
      apiCalls?.map((a) => new Date(a.timestamp).getTime() / 1000) ?? null
    data = apiCalls?.map((a) => a.unique_count) ?? null
  }
  return (
    <LineChart
      title='Unique Users'
      tooltipTitle='Unique Users'
      titleTooltipComponent={UniqueUsersInfoTooltip}
      error={error}
      data={data}
      labels={labels}
      selection={bucket}
      options={[Bucket.ALL_TIME, Bucket.MONTH, Bucket.WEEK]}
      onSelectOption={(option: string) => setBucket(option as Bucket)}
      showLeadingDay
    />
  )
}

export default IndividualServiceUniqueUsersChart
