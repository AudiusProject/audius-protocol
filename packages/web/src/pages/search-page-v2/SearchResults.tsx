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
import { css } from '@emotion/css'
import { range } from 'lodash'
import { useDispatch } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import { CollectionCard } from 'components/collection'
import Lineup from 'components/lineup/Lineup'
import { LineupVariant } from 'components/lineup/types'
import { UserCard } from 'components/user-card'
import { useRouteMatch } from 'hooks/useRouteMatch'
import { useSelector } from 'utils/reducer'
import { SEARCH_CATEGORY_PAGE } from 'utils/route'

import { NoResultsTile } from './NoResultsTile'

const MAX_RESULTS = 100
const MAX_PREVIEW_RESULTS = 5
const MAX_TRACK_PREVIEW_RESULTS = 10
const PAGE_WIDTH = 1080
const HALF_TILE_WIDTH = (PAGE_WIDTH - 16) / 2

type TrackView = 'grid' | 'list'

enum Category {
  ALL = 'all',
  PROFILES = 'profiles',
  TRACKS = 'tracks',
  PLAYLISTS = 'playlists',
  ALBUMS = 'albums'
}

type SearchResultsProps = {
  query: string
}

const messages = {
  profiles: 'Profiles',
  tracks: 'Tracks',
  albums: 'Albums',
  playlists: 'Playlists'
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
  const categoryMatch = useRouteMatch<{ query: string; category: string }>(
    SEARCH_CATEGORY_PAGE
  )

  const isLoading = results.status === Status.LOADING
  const dispatch = useDispatch()
  useEffect(() => {
    dispatch(fetchSearchPageResults(query, SearchKind.ALL, 50, 0))
  }, [dispatch, query])

  const isCategoryActive = useCallback(
    (category: Category) => categoryMatch?.category === category,
    [categoryMatch]
  )
  const isCategoryVisible = useCallback(
    (category: Category) =>
      !categoryMatch ||
      categoryMatch.category === Category.ALL ||
      categoryMatch.category === category,
    [categoryMatch]
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

  const [tracksLayout, setTracksLayout] = useState<TrackView>('list')
  const isTrackGridView =
    !isCategoryActive(Category.TRACKS) || tracksLayout === 'grid'

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
              <OptionsFilterButton
                selection={tracksLayout}
                variant='replaceLabel'
                onChange={(value) => {
                  setTracksLayout(value as TrackView)
                }}
                options={[
                  { label: 'Grid', value: 'grid' },
                  { label: 'List', value: 'list' }
                ]}
              />
            ) : null}
          </Flex>
          <Flex gap='l'>
            {!isLoading && tracksLineup ? (
              <Lineup
                lineupContainerStyles={css({ width: '100%' })}
                tileContainerStyles={css({
                  display: 'grid',
                  gridTemplateColumns: isTrackGridView ? '1fr 1fr' : '1fr',
                  gap: '4px 16px',
                  justifyContent: 'space-between'
                })}
                tileStyles={css({
                  maxWidth: isTrackGridView ? HALF_TILE_WIDTH : PAGE_WIDTH
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
