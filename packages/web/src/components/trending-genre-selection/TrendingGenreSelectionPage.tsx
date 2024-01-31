import { TimeRange } from '@audius/common/models'
import {
  trendingPageLineupActions,
  trendingPageActions,
  trendingPageSelectors
} from '@audius/common/store'
import { Genre, ELECTRONIC_PREFIX, TRENDING_GENRES } from '@audius/common/utils'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { AppState } from 'store/types'
import { TRENDING_PAGE } from 'utils/route'

import TrendingGenreSelectionPage from './components/TrendingGenreSelectionPage'
const { getTrendingGenre, getTrendingTimeRange } = trendingPageSelectors
const { trendingMonthActions, trendingWeekActions, trendingAllTimeActions } =
  trendingPageLineupActions

type ConnectedTrendingGenreSelectionPageProps = {} & ReturnType<
  typeof mapStateToProps
> &
  ReturnType<typeof mapDispatchToProps>

// Mobile page for selecting a genre by which to filter trending.
const ConnectedTrendingGenreSelectionPage = ({
  setTrendingGenre,
  genre,
  timeRange,
  setTrendingTimeRange,
  goToTrending,
  resetAllTrending
}: ConnectedTrendingGenreSelectionPageProps) => {
  const setTrimmedGenre = (genre: string | null) => {
    const trimmedGenre =
      genre !== null ? genre.replace(ELECTRONIC_PREFIX, '') : genre
    setTrendingGenre(trimmedGenre as Genre | null)
    resetAllTrending()
    setTrendingTimeRange(timeRange)
    goToTrending()
  }
  return (
    <TrendingGenreSelectionPage
      genres={TRENDING_GENRES}
      didSelectGenre={setTrimmedGenre}
      selectedGenre={genre}
    />
  )
}

function mapStateToProps(state: AppState) {
  return {
    genre: getTrendingGenre(state),
    timeRange: getTrendingTimeRange(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    setTrendingGenre: (genre: Genre | null) =>
      dispatch(trendingPageActions.setTrendingGenre(genre)),
    setTrendingTimeRange: (timeRange: TimeRange) =>
      dispatch(trendingPageActions.setTrendingTimeRange(timeRange)),
    goToTrending: () => dispatch(pushRoute(TRENDING_PAGE)),
    resetAllTrending: () => {
      dispatch(trendingWeekActions.reset())
      dispatch(trendingMonthActions.reset())
      dispatch(trendingAllTimeActions.reset())
    }
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ConnectedTrendingGenreSelectionPage)
