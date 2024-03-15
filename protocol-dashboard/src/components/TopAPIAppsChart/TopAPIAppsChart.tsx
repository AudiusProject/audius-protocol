import React, { useCallback } from 'react'

import VerticalBarChart from 'components/VerticalBarChart'
import { useTopApps } from 'store/cache/analytics/hooks'
import { Bucket, MetricError } from 'store/cache/analytics/slice'
import { usePushRoute } from 'utils/effects'
import { useIsMobile } from 'utils/hooks'
import { API_LEADERBOARD } from 'utils/routes'

type OwnProps = {
  className?: string
}

const messages = {
  title: 'Top API Apps by Total Requests',
  yLabel: 'Total Requests',
  viewMore: 'View Full Leaderboard'
}

const DESKTOP_LIMIT = 10
const MOBILE_LIMIT = 3

type TopAPIAppsChartProps = OwnProps

const TopAPIAppsChart: React.FC<TopAPIAppsChartProps> = () => {
  const pushRoute = usePushRoute()
  const isMobile = useIsMobile()
  const limit = isMobile ? MOBILE_LIMIT : DESKTOP_LIMIT
  const { topApps } = useTopApps(Bucket.MONTH, limit)
  let error, labels, data
  if (topApps === MetricError.ERROR) {
    error = true
    labels = []
    data = []
  } else {
    labels = topApps ? Object.keys(topApps) : null
    data = topApps ? Object.values(topApps) : null
  }

  const onViewMore = useCallback(() => {
    pushRoute(API_LEADERBOARD)
  }, [pushRoute])

  return (
    <VerticalBarChart
      title={messages.title}
      yLabel={messages.yLabel}
      data={data}
      labels={labels}
      error={error}
      viewMore={messages.viewMore}
      onViewMore={onViewMore}
    />
  )
}

export default TopAPIAppsChart
