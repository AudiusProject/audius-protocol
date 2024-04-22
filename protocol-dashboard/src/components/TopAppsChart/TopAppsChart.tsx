import React, { useCallback, useState } from 'react'

import BarChart from 'components/BarChart'
import { TopApiAppsInfoTooltip } from 'components/InfoTooltip/InfoTooltips'
import { useTopApps } from 'store/cache/analytics/hooks'
import { Bucket, MetricError } from 'store/cache/analytics/slice'
import { usePushRoute } from 'utils/effects'
import { API } from 'utils/routes'

const DISPLAY_APP_COUNT = 8

type OwnProps = {}

type TopAppsChartProps = OwnProps

const TopAppsChart: React.FC<TopAppsChartProps> = () => {
  const pushRoute = usePushRoute()
  const [bucket, setBucket] = useState(Bucket.MONTH)

  const { topApps } = useTopApps(bucket, DISPLAY_APP_COUNT)
  let error, labels, data
  if (topApps === MetricError.ERROR) {
    error = true
    labels = []
    data = []
  } else {
    labels = topApps ? Object.keys(topApps) : null
    data = topApps ? Object.values(topApps) : null
  }

  const goToAPIPage = useCallback(() => pushRoute(API), [pushRoute])

  return (
    <BarChart
      title='Top API Apps'
      titleTooltipComponent={TopApiAppsInfoTooltip}
      column1='apps'
      column2='requests'
      data={data}
      labels={labels}
      error={error}
      selection={bucket}
      options={[Bucket.ALL_TIME, Bucket.YEAR, Bucket.MONTH, Bucket.WEEK]}
      onSelectOption={(option: string) => setBucket(option as Bucket)}
      onClick={goToAPIPage}
    />
  )
}

export default TopAppsChart
