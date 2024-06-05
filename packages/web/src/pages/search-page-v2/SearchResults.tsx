import { useCallback, useEffect, useRef, useState } from 'react'

import { useGetSearchFull } from '@audius/common/src/api/search'
import { Name } from '@audius/common/src/models/Analytics'
import { accountSelectors } from '@audius/common/src/store/account'
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
  searchResultsPageTracksLineupActions
} from '@audius/common/store'
import { FilterButton } from '@audius/harmony'
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

const { getUserId } = accountSelectors

const MAX_RESULTS = 100
const MAX_PREVIEW_RESULTS = 5
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
  const currentUserId = useSelector(getUserId)
  const currentQueueItem = useSelector(getCurrentQueueItem)
  const tracks = useSelector(getTracksLineup)
  const playing = useSelector(getPlaying)
  const buffering = useSelector(getBuffering)
  const results = useGetSearchFull({ currentUserId, query })
  const categoryMatch = useRouteMatch<{ query: string; category: string }>(
    SEARCH_CATEGORY_PAGE
  )

  const dispatch = useDispatch()
  useEffect(() => {
    dispatch(fetchSearchPageResults(query, SearchKind.ALL, 50, 0))
  }, [dispatch, query])

  const [isLoading, setIsLoading] = useState(true)
  const prevQuery = useRef('')
  useEffect(() => {
    if (results.data && isLoading && query !== prevQuery.current) {
      prevQuery.current = query
      setIsLoading(false)
    } else if (!isLoading && query !== prevQuery.current) {
      setIsLoading(true)
    }
  }, [results, query, isLoading])

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

  const profileLimit =
    categoryMatch?.category === Category.PROFILES
      ? MAX_RESULTS
      : MAX_PREVIEW_RESULTS
  const playlistLimit =
    categoryMatch?.category === Category.PLAYLISTS
      ? MAX_RESULTS
      : MAX_PREVIEW_RESULTS
  const albumLimit =
    categoryMatch?.category === Category.ALBUMS
      ? MAX_RESULTS
      : MAX_PREVIEW_RESULTS

  const profileData = results.data?.users.slice(0, profileLimit) ?? []
  const playlistData = results.data?.playlists.slice(0, playlistLimit) ?? []
  const albumData = results.data?.albums.slice(0, albumLimit) ?? []

  const onClickTile = useCallback(
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

  const [trackView, setTrackView] = useState<TrackView>('list')
  const isTrackGridView = isCategoryActive(Category.ALL) || trackView === 'grid'

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
              : profileData.map((user) => (
                  <UserCard key={user.user_id} id={user.user_id} size='s' />
                ))}
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
              <FilterButton
                selection={trackView}
                variant='replaceLabel'
                onSelect={(value) => {
                  setTrackView(value as TrackView)
                }}
                options={[
                  { label: 'Grid', value: 'grid' },
                  { label: 'List', value: 'list' }
                ]}
              />
            ) : null}
          </Flex>
          <Flex gap='l'>
            {results.data ? (
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
                lineup={tracks}
                playingSource={currentQueueItem.source}
                playingUid={currentQueueItem.uid}
                playingTrackId={
                  currentQueueItem.track && currentQueueItem.track.track_id
                }
                playing={playing}
                buffering={buffering}
                playTrack={(uid, trackId) => {
                  onClickTile(trackId)
                  dispatch(searchResultsPageTracksLineupActions.play(uid))
                }}
                pauseTrack={() =>
                  dispatch(searchResultsPageTracksLineupActions.pause())
                }
                actions={searchResultsPageTracksLineupActions}
                onClickTile={(trackId) => {
                  onClickTile(trackId)
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
              : albumData.map((album) => (
                  <CollectionCard
                    key={album.playlist_id}
                    id={album.playlist_id}
                    size='s'
                  />
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
              : playlistData.map((playlist) => (
                  <CollectionCard
                    key={playlist.playlist_id}
                    id={playlist.playlist_id}
                    size='s'
                  />
                ))}
          </Box>
        </Flex>
      ) : null}
    </Flex>
  )
}
