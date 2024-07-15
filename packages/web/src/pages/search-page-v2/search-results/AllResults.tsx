import { useCallback, useEffect, useRef } from 'react'

import { Status } from '@audius/common/models'
import {
  fetchSearchPageTags,
  fetchSearchPageResults
} from '@audius/common/src/store/pages/search-results/actions'
import { SearchKind, searchResultsPageSelectors } from '@audius/common/store'
import { Flex } from '@audius/harmony/src/components/layout'
import { useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom'

import { useIsMobile } from 'hooks/useIsMobile'
import { useSelector } from 'utils/reducer'

import { NoResultsTile } from './NoResultsTile'
import { ResultsAlbumsView } from './ResultsAlbumsView'
import { ResultsPlaylistsView } from './ResultsPlaylistsView'
import { ResultsProfilesView } from './ResultsProfilesView'
import { ResultsTracksView } from './TrackResults'
import { CategoryView } from './types'
import { useSearchParams } from './utils'

export const SearchResults = () => {
  const isMobile = useIsMobile()
  const containerRef = useRef<HTMLDivElement>(null)
  const results = useSelector(searchResultsPageSelectors.getSearchResults)
  const { category } = useParams<{ category: CategoryView }>()
  const searchParams = useSearchParams()

  const dispatch = useDispatch()
  useEffect(() => {
    const { query, category, ...filters } = searchParams

    if (query?.[0] === '#') {
      dispatch(
        fetchSearchPageTags({
          tag: query || '',
          limit: 50,
          offset: 0,
          searchKind: category as any,
          ...filters
        })
      )
    } else {
      dispatch(
        fetchSearchPageResults({
          searchText: query || '',
          kind: category as any,
          limit: 50,
          offset: 0,
          ...filters
        })
      )
    }
  }, [dispatch, searchParams])

  const isCategoryActive = useCallback(
    (c: CategoryView) => c === category,
    [category]
  )

  const isAllCategoriesVisible =
    category === undefined || category === CategoryView.ALL

  const isLoading = results.status === Status.LOADING

  const isTracksVisible =
    isCategoryActive(CategoryView.TRACKS) ||
    (isAllCategoriesVisible &&
      ((results.trackIds && results.trackIds.length > 0) || isLoading))
  const isProfilesVisible =
    isCategoryActive(CategoryView.PROFILES) ||
    (isAllCategoriesVisible &&
      ((results.artistIds && results.artistIds.length > 0) || isLoading))
  const isAlbumsVisible =
    isCategoryActive(CategoryView.ALBUMS) ||
    (isAllCategoriesVisible &&
      ((results.albumIds && results.albumIds.length > 0) || isLoading))
  const isPlaylistsVisible =
    isCategoryActive(CategoryView.PLAYLISTS) ||
    (isAllCategoriesVisible &&
      ((results.playlistIds && results.playlistIds.length > 0) || isLoading))

  // Check if there are no results
  const isResultsEmpty =
    results.albumIds?.length === 0 &&
    results.artistIds?.length === 0 &&
    results.playlistIds?.length === 0 &&
    results.trackIds?.length === 0

  const showNoResultsTile =
    results.status !== Status.LOADING &&
    (isResultsEmpty ||
      (isCategoryActive(CategoryView.ALBUMS) &&
        results.albumIds?.length === 0) ||
      (isCategoryActive(CategoryView.PROFILES) &&
        results.artistIds?.length === 0) ||
      (isCategoryActive(CategoryView.PLAYLISTS) &&
        results.playlistIds?.length === 0) ||
      (isCategoryActive(CategoryView.TRACKS) && results.trackIds?.length === 0))

  if (showNoResultsTile) return <NoResultsTile />

  return (
    <Flex
      direction='column'
      gap='unit10'
      p={isMobile ? 'm' : undefined}
      ref={containerRef}
    >
      {isProfilesVisible ? <ResultsProfilesView /> : null}
      {isTracksVisible ? <ResultsTracksView /> : null}
      {isAlbumsVisible ? <ResultsAlbumsView /> : null}
      {isPlaylistsVisible ? <ResultsPlaylistsView /> : null}
    </Flex>
  )
}
