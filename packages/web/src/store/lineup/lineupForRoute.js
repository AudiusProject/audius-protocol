import {
  trackPageSelectors,
  trendingPageSelectors,
  searchResultsPageSelectors,
  savedPageSelectors,
  profilePageSelectors,
  historyPageSelectors,
  feedPageSelectors,
  collectionPageSelectors
} from '@audius/common'
import { matchPath } from 'react-router'

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
  getPathname,
  LIBRARY_PAGE
} from 'utils/route'
const { getCollectionTracksLineup } = collectionPageSelectors
const { getDiscoverFeedLineup } = feedPageSelectors
const { getHistoryTracksLineup } = historyPageSelectors
const { getProfileTracksLineup } = profilePageSelectors
const { getSavedTracksLineup } = savedPageSelectors
const { getSearchTracksLineup } = searchResultsPageSelectors
const { getLineup } = trackPageSelectors
const { getCurrentDiscoverTrendingLineup } = trendingPageSelectors

export const getLineupSelectorForRoute = (location) => {
  const matchPage = (path) => {
    const match = matchPath(getPathname(location), {
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
  if (matchPage(SAVED_PAGE) || matchPage(LIBRARY_PAGE)) {
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
