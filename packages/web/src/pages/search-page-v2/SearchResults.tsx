import { useCallback, useEffect, useRef, useState } from 'react'

import { Status } from '@audius/common/models'
import { Name } from '@audius/common/src/models/Analytics'
import { makeGetLineupMetadatas } from '@audius/common/src/store/lineup/selectors'
import { fetchSearchPageResults } from '@audius/common/src/store/pages/search-results/actions'
import { getSearchTracksLineup } from '@audius/common/src/store/pages/search-results/selectors'
import {
  getBuffering,
  getPlaying
} from '@audius/common/src/store/player/selectors'
import { makeGetCurrent } from '@audius/common/src/store/queue/selectors'
import {
  SearchKind,
  searchResultsPageSelectors,
  searchResultsPageTracksLineupActions
} from '@audius/common/store'
import { OptionsFilterButton } from '@audius/harmony'
import { Box, Flex } from '@audius/harmony/src/components/layout'
import { Text } from '@audius/harmony/src/components/text'
import { Genre, Mood } from '@audius/sdk'
import { css } from '@emotion/css'
import { range } from 'lodash'
import { useDispatch } from 'react-redux'
import { useSearchParams } from 'react-router-dom-v5-compat'

import { make } from 'common/store/analytics/actions'
import { CollectionCard } from 'components/collection'
import Lineup from 'components/lineup/Lineup'
import { LineupVariant } from 'components/lineup/types'
import { UserCard } from 'components/user-card'
import { useRouteMatch } from 'hooks/useRouteMatch'
import { useSelector } from 'utils/reducer'
import { SEARCH_PAGE } from 'utils/route'

import { NoResultsTile } from './NoResultsTile'
import { useUpdateSearchParams } from './utils'

const MAX_RESULTS = 100
const MAX_PREVIEW_RESULTS = 5
const MAX_TRACK_PREVIEW_RESULTS = 10
const PAGE_WIDTH = 1080
const HALF_TILE_WIDTH = (PAGE_WIDTH - 16) / 2

enum Category {
  ALL = 'all',
  PROFILES = 'profiles',
  TRACKS = 'tracks',
  PLAYLISTS = 'playlists',
  ALBUMS = 'albums'
}

type ViewLayout = 'grid' | 'list'
const viewLayoutOptions: { label: string; value: ViewLayout }[] = [
  { label: 'Grid', value: 'grid' },
  { label: 'List', value: 'list' }
]

type SortOption = 'relevant' | 'recent'
const sortOptions: { label: string; value: SortOption }[] = [
  { label: 'Most Relevant', value: 'relevant' },
  { label: 'Most Recent', value: 'recent' }
]

type SearchResultsProps = {
  query: string
}

const messages = {
  profiles: 'Profiles',
  tracks: 'Tracks',
  albums: 'Albums',
  playlists: 'Playlists',
  layoutOptionsLabel: 'View As',
  sortOptionsLabel: 'Sort By'
}

const cardGridStyles = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, 200px)',
  justifyContent: 'space-between',
  gap: 16
}

const getCurrentQueueItem = makeGetCurrent()
const getTracksLineup = makeGetLineupMetadatas(getSearchTracksLineup)

export const SearchResults = ({ query }: SearchResultsProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const currentQueueItem = useSelector(getCurrentQueueItem)
  const tracksLineup = useSelector(getTracksLineup)
  const playing = useSelector(getPlaying)
  const buffering = useSelector(getBuffering)
  const results = useSelector(searchResultsPageSelectors.getSearchResults)
  const routeMatch = useRouteMatch<{
    category: string
  }>(SEARCH_PAGE)
  const [urlSearchParams] = useSearchParams()
  const sort = urlSearchParams.get('sort')
  const genre = urlSearchParams.get('genre')
  const mood = urlSearchParams.get('mood')
  const isVerified = urlSearchParams.get('is_verified')

  const isLoading = results.status === Status.LOADING
  const dispatch = useDispatch()
  useEffect(() => {
    dispatch(
      fetchSearchPageResults({
        searchText: query,
        kind: SearchKind.ALL,
        limit: 50,
        offset: 0,
        genre: (genre || undefined) as Genre,
        mood: (mood || undefined) as Mood,
        isVerified: isVerified === 'true'
      })
    )
  }, [dispatch, query, sort, genre, mood, isVerified])

  const isCategoryActive = useCallback(
    (category: Category) => routeMatch?.category === category,
    [routeMatch]
  )
  const isCategoryVisible = useCallback(
    (category: Category) =>
      !routeMatch ||
      routeMatch.category === undefined ||
      routeMatch.category === Category.ALL ||
      routeMatch.category === category,
    [routeMatch]
  )

  const profileLimit = isCategoryActive(Category.PROFILES)
    ? MAX_RESULTS
    : MAX_PREVIEW_RESULTS
  const playlistLimit = isCategoryActive(Category.PLAYLISTS)
    ? MAX_RESULTS
    : MAX_PREVIEW_RESULTS
  const albumLimit = isCategoryActive(Category.ALBUMS)
    ? MAX_RESULTS
    : MAX_PREVIEW_RESULTS
  const trackLimit = isCategoryActive(Category.TRACKS)
    ? MAX_RESULTS
    : MAX_TRACK_PREVIEW_RESULTS

  const profileIds = results.artistIds?.slice(0, profileLimit) ?? []
  const playlistIds = results.playlistIds?.slice(0, playlistLimit) ?? []
  const albumIds = results.albumIds?.slice(0, albumLimit) ?? []
  const tracksData = {
    ...tracksLineup,
    entries: tracksLineup.entries.slice(0, trackLimit)
  }

  const onClickTrackTile = useCallback(
    (id?: number) => {
      dispatch(
        make(Name.SEARCH_RESULT_SELECT, {
          searchText: query,
          kind: 'track',
          id,
          source: 'search results page'
        })
      )
    },
    [dispatch, query]
  )

  const [tracksLayout, setTracksLayout] = useState<ViewLayout>('list')
  const isTrackGridLayout =
    !isCategoryActive(Category.TRACKS) || tracksLayout === 'grid'

  const updateSearchParams = useUpdateSearchParams('sort')

  const sortButton = (
    <OptionsFilterButton
      selection={sort ?? 'relevant'}
      variant='replaceLabel'
      optionsLabel={messages.sortOptionsLabel}
      onChange={updateSearchParams}
      options={sortOptions}
    />
  )

  // Check if there are no results
  const isResultsEmpty =
    results.albumIds?.length === 0 &&
    results.artistIds?.length === 0 &&
    results.playlistIds?.length === 0 &&
    results.trackIds?.length === 0

  const showNoResultsTile =
    isResultsEmpty ||
    (isCategoryActive(Category.ALBUMS) && results.albumIds?.length === 0) ||
    (isCategoryActive(Category.PROFILES) && results.artistIds?.length === 0) ||
    (isCategoryActive(Category.PLAYLISTS) &&
      results.playlistIds?.length === 0) ||
    (isCategoryActive(Category.TRACKS) && results.trackIds?.length === 0)

  if (showNoResultsTile) return <NoResultsTile />

  return (
    <Flex direction='column' gap='unit10' ref={containerRef}>
      {isCategoryVisible(Category.PROFILES) ? (
        <Flex direction='column' gap='xl'>
          <Flex justifyContent='space-between' alignItems='center'>
            <Text variant='heading' textAlign='left'>
              {messages.profiles}
            </Text>
            {isCategoryActive(Category.PROFILES) ? (
              <Flex gap='s'>{sortButton}</Flex>
            ) : null}
          </Flex>
          <Box css={cardGridStyles}>
            {isLoading
              ? range(5).map((_, i) => (
                  <UserCard
                    key={`user_card_sekeleton_${i}`}
                    id={0}
                    size='s'
                    loading={true}
                  />
                ))
              : profileIds.map((id) => <UserCard key={id} id={id} size='s' />)}
          </Box>
        </Flex>
      ) : null}
      {isCategoryVisible(Category.TRACKS) ? (
        <Flex direction='column' gap='xl' wrap='wrap'>
          <Flex justifyContent='space-between' alignItems='center'>
            <Text variant='heading' textAlign='left'>
              {messages.tracks}
            </Text>
            {isCategoryActive(Category.TRACKS) ? (
              <Flex gap='s'>
                {sortButton}
                <OptionsFilterButton
                  selection={tracksLayout}
                  variant='replaceLabel'
                  optionsLabel={messages.layoutOptionsLabel}
                  onChange={(value) => {
                    setTracksLayout(value as ViewLayout)
                  }}
                  options={viewLayoutOptions}
                />
              </Flex>
            ) : null}
          </Flex>
          <Flex gap='l'>
            {!isLoading && tracksLineup ? (
              <Lineup
                lineupContainerStyles={css({ width: '100%' })}
                tileContainerStyles={css({
                  display: 'grid',
                  gridTemplateColumns: isTrackGridLayout ? '1fr 1fr' : '1fr',
                  gap: '4px 16px',
                  justifyContent: 'space-between'
                })}
                tileStyles={css({
                  maxWidth: isTrackGridLayout ? HALF_TILE_WIDTH : PAGE_WIDTH
                })}
                key='searchTracks'
                variant={LineupVariant.SECTION}
                lineup={tracksData}
                playingSource={currentQueueItem.source}
                playingUid={currentQueueItem.uid}
                playingTrackId={
                  currentQueueItem.track && currentQueueItem.track.track_id
                }
                playing={playing}
                buffering={buffering}
                playTrack={(uid, trackId) => {
                  onClickTrackTile(trackId)
                  dispatch(searchResultsPageTracksLineupActions.play(uid))
                }}
                pauseTrack={() =>
                  dispatch(searchResultsPageTracksLineupActions.pause())
                }
                actions={searchResultsPageTracksLineupActions}
                onClickTile={(trackId) => {
                  onClickTrackTile(trackId)
                }}
              />
            ) : null}
          </Flex>
        </Flex>
      ) : null}
      {isCategoryVisible(Category.ALBUMS) ? (
        <Flex direction='column' gap='xl'>
          <Flex justifyContent='space-between' alignItems='center'>
            <Text variant='heading' textAlign='left'>
              {messages.albums}
            </Text>
            {isCategoryActive(Category.ALBUMS) ? (
              <Flex gap='s'>{sortButton}</Flex>
            ) : null}
          </Flex>
          <Box css={cardGridStyles}>
            {isLoading
              ? range(5).map((_, i) => (
                  <CollectionCard
                    key={`user_card_sekeleton_${i}`}
                    id={0}
                    size='s'
                    loading={true}
                  />
                ))
              : albumIds.map((id) => (
                  <CollectionCard key={id} id={id} size='s' />
                ))}
          </Box>
        </Flex>
      ) : null}
      {isCategoryVisible(Category.PLAYLISTS) ? (
        <Flex direction='column' gap='xl'>
          <Flex justifyContent='space-between' alignItems='center'>
            <Text variant='heading' textAlign='left'>
              {messages.playlists}
            </Text>
            {isCategoryActive(Category.PLAYLISTS) ? (
              <Flex gap='s'>{sortButton}</Flex>
            ) : null}
          </Flex>
          <Box css={cardGridStyles}>
            {isLoading
              ? range(5).map((_, i) => (
                  <CollectionCard
                    key={`user_card_sekeleton_${i}`}
                    id={0}
                    size='s'
                    loading={true}
                  />
                ))
              : playlistIds.map((id) => (
                  <CollectionCard key={id} id={id} size='s' />
                ))}
          </Box>
        </Flex>
      ) : null}
    </Flex>
  )
}
