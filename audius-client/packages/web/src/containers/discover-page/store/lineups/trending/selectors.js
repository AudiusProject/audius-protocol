import { makeGetTrendingLineup } from 'containers/discover-page/store/selectors'

export const makeGetTrendingOrder = timeRange => state => {
  const lineup = makeGetTrendingLineup(timeRange)(state)
  return lineup.trendingOrder
}

export const makeGetTrendingStats = timeRange => state => {
  const lineup = makeGetTrendingLineup(timeRange)(state)
  return lineup.trendingStats
}
