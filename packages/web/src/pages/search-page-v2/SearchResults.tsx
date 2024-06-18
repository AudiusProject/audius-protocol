import { useCallback, useEffect, useRef } from 'react'

import {
  fetchSearchPageTags,
  fetchSearchPageResults
} from '@audius/common/src/store/pages/search-results/actions'
import { SearchKind, searchResultsPageSelectors } from '@audius/common/store'
import { Flex } from '@audius/harmony/src/components/layout'
import { Genre, Mood } from '@audius/sdk'
import { useDispatch } from 'react-redux'
import { useSearchParams } from 'react-router-dom-v5-compat'

import { useRouteMatch } from 'hooks/useRouteMatch'
import { useSelector } from 'utils/reducer'
import { SEARCH_PAGE } from 'utils/route'

import { NoResultsTile } from './NoResultsTile'
import { ResultsAlbumsView } from './ResultsAlbumsView'
import { ResultsPlaylistsView } from './ResultsPlaylistsView'
import { ResultsProfilesView } from './ResultsProfilesView'
import { ResultsTracksView } from './ResultsTracksView'
import { CategoryView } from './types'

export const SearchResults = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const results = useSelector(searchResultsPageSelectors.getSearchResults)
  const routeMatch = useRouteMatch<{ category: string }>(SEARCH_PAGE)
  const [urlSearchParams] = useSearchParams()
  const query = urlSearchParams.get('query')
  const sort = urlSearchParams.get('sort')
  const genre = urlSearchParams.get('genre')
  const mood = urlSearchParams.get('mood')
  const bpm = urlSearchParams.get('bpm')
  const key = urlSearchParams.get('key')
  const isVerified = urlSearchParams.get('isVerified')
  const hasDownloads = urlSearchParams.get('hasDownloads')
  const isPremium = urlSearchParams.get('isPremium')

  const dispatch = useDispatch()
  useEffect(() => {
    if (query?.[0] === '#') {
      dispatch(
        fetchSearchPageTags({
          tag: query || '',
          searchKind: SearchKind.ALL,
          limit: 50,
          offset: 0
          // genre: (genre || undefined) as Genre,
          // mood: (mood || undefined) as Mood,
          // isVerified: isVerified === 'true'
        })
      )
    } else {
      dispatch(
        fetchSearchPageResults({
          searchText: query || '',
          kind: SearchKind.ALL,
          limit: 50,
          offset: 0,
          genre: (genre || undefined) as Genre,
          mood: (mood || undefined) as Mood,
          bpm: bpm || undefined,
          key: key || undefined,
          isVerified: isVerified === 'true',
          hasDownloads: hasDownloads === 'true',
          isPremium: isPremium === 'true'
        })
      )
    }
  }, [
    dispatch,
    query,
    sort,
    genre,
    mood,
    isVerified,
    hasDownloads,
    bpm,
    key,
    isPremium
  ])

  const isCategoryActive = useCallback(
    (category: CategoryView) => routeMatch?.category === category,
    [routeMatch]
  )
  const isAllCategoriesVisible =
    !routeMatch ||
    routeMatch.category === undefined ||
    routeMatch.category === CategoryView.ALL

  const isTracksVisible =
    isCategoryActive(CategoryView.TRACKS) ||
    (isAllCategoriesVisible && results.trackIds && results.trackIds.length > 0)
  const isProfilesVisible =
    isCategoryActive(CategoryView.PROFILES) ||
    (isAllCategoriesVisible &&
      results.artistIds &&
      results.artistIds.length > 0)
  const isAlbumsVisible =
    isCategoryActive(CategoryView.ALBUMS) ||
    (isAllCategoriesVisible && results.albumIds && results.albumIds.length > 0)
  const isPlaylistsVisible =
    isCategoryActive(CategoryView.PLAYLISTS) ||
    (isAllCategoriesVisible &&
      results.playlistIds &&
      results.playlistIds.length > 0)

  // Check if there are no results
  const isResultsEmpty =
    results.albumIds?.length === 0 &&
    results.artistIds?.length === 0 &&
    results.playlistIds?.length === 0 &&
    results.trackIds?.length === 0

  const showNoResultsTile =
    isResultsEmpty ||
    (isCategoryActive(CategoryView.ALBUMS) && results.albumIds?.length === 0) ||
    (isCategoryActive(CategoryView.PROFILES) &&
      results.artistIds?.length === 0) ||
    (isCategoryActive(CategoryView.PLAYLISTS) &&
      results.playlistIds?.length === 0) ||
    (isCategoryActive(CategoryView.TRACKS) && results.trackIds?.length === 0)

  if (showNoResultsTile) return <NoResultsTile />

  return (
    <Flex direction='column' gap='unit10' ref={containerRef}>
      {isProfilesVisible ? <ResultsProfilesView /> : null}
      {isTracksVisible ? <ResultsTracksView /> : null}
      {isAlbumsVisible ? <ResultsAlbumsView /> : null}
      {isPlaylistsVisible ? <ResultsPlaylistsView /> : null}
    </Flex>
  )
}
