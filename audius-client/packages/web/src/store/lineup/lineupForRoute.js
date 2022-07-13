import { matchPath } from 'react-router'

import { getCollectionTracksLineup } from 'common/store/pages/collection/selectors'
import { getDiscoverFeedLineup } from 'common/store/pages/feed/selectors'
import { getHistoryTracksLineup } from 'common/store/pages/history-page/selectors'
import { getProfileTracksLineup } from 'common/store/pages/profile/selectors'
import { getSavedTracksLineup } from 'common/store/pages/saved-page/selectors'
import { getSearchTracksLineup } from 'common/store/pages/search-results/selectors'
import { getLineup } from 'common/store/pages/track/selectors'
import { getCurrentDiscoverTrendingLineup } from 'common/store/pages/trending/selectors'
import {
  FEED_PAGE,
  TRENDING_PAGE,
  SAVED_PAGE,
  HISTORY_PAGE,
  SEARCH_CATEGORY_PAGE,
  SEARCH_PAGE,
  PLAYLIST_PAGE,
  ALBUM_PAGE,
  TRACK_PAGE,
  PROFILE_PAGE,
  UPLOAD_PAGE,
  DASHBOARD_PAGE,
  SETTINGS_PAGE,
  NOT_FOUND_PAGE,
  getPathname
} from 'utils/route'

export const getLineupSelectorForRoute = (state) => {
  const matchPage = (path) => {
    const match = matchPath(getPathname(), {
      path,
      exact: true
    })
    return !!match
  }

  if (
    matchPage(UPLOAD_PAGE) ||
    matchPage(DASHBOARD_PAGE) ||
    matchPage(SETTINGS_PAGE) ||
    matchPage(NOT_FOUND_PAGE)
  ) {
    return () => null
  }

  if (matchPage(FEED_PAGE)) {
    return getDiscoverFeedLineup
  }
  if (matchPage(TRENDING_PAGE)) {
    return getCurrentDiscoverTrendingLineup
  }
  if (matchPage(SEARCH_CATEGORY_PAGE) || matchPage(SEARCH_PAGE)) {
    return getSearchTracksLineup
  }
  if (matchPage(SAVED_PAGE)) {
    return getSavedTracksLineup
  }
  if (matchPage(HISTORY_PAGE)) {
    return getHistoryTracksLineup
  }
  if (matchPage(PLAYLIST_PAGE) || matchPage(ALBUM_PAGE)) {
    return getCollectionTracksLineup
  }
  if (matchPage(TRACK_PAGE)) {
    return getLineup
  }
  if (matchPage(PROFILE_PAGE)) {
    return getProfileTracksLineup
  }
  return getDiscoverFeedLineup
}
