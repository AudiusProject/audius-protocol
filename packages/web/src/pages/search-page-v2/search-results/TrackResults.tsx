import { useCallback, useState } from 'react'

import { Kind, Name, Status } from '@audius/common/models'
import {
  lineupSelectors,
  playerSelectors,
  queueSelectors,
  searchResultsPageSelectors,
  searchResultsPageTracksLineupActions,
  searchActions,
  SearchKind
} from '@audius/common/store'
import { Flex, OptionsFilterButton, Text } from '@audius/harmony'
import { css } from '@emotion/css'
import { range } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import Lineup from 'components/lineup/Lineup'
import { LineupTileSkeleton } from 'components/lineup/LineupTileSkeleton'
import { useIsMobile } from 'hooks/useIsMobile'
import { useMainContentRef } from 'pages/MainContentContext'

import { NoResultsTile } from '../NoResultsTile'
import { ViewLayout, viewLayoutOptions } from '../types'
import { useSearchParams, useUpdateSearchParams } from '../utils'

const { makeGetLineupMetadatas } = lineupSelectors
const { getBuffering, getPlaying } = playerSelectors
const { getSearchTracksLineup } = searchResultsPageSelectors
const { makeGetCurrent } = queueSelectors
const { addItem: addRecentSearch } = searchActions

const PAGE_WIDTH = 1080
const HALF_TILE_WIDTH = (PAGE_WIDTH - 16) / 2

const messages = {
  tracks: 'Tracks',
  layoutOptionsLabel: 'View As',
  sortOptionsLabel: 'Sort By'
}

const getCurrentQueueItem = makeGetCurrent()
const getSearchTracksLineupMetadatas = makeGetLineupMetadatas(
  getSearchTracksLineup
)

type TrackResultsProps = {
  viewLayout?: ViewLayout
  category?: SearchKind
}

export const TrackResults = (props: TrackResultsProps) => {
  const { category = 'tracks', viewLayout = 'list' } = props
  const mainContentRef = useMainContentRef()

  const dispatch = useDispatch()
  const currentQueueItem = useSelector(getCurrentQueueItem)
  const playing = useSelector(getPlaying)
  const buffering = useSelector(getBuffering)

  const isTrackGridLayout = viewLayout === 'grid'

  const lineup = useSelector(getSearchTracksLineupMetadatas)
  const isLoading = lineup.status === Status.LOADING

  const searchParams = useSearchParams()

  const getResults = useCallback(
    (offset: number, limit: number, overwrite: boolean) => {
      const { query, ...filters } = searchParams

      dispatch(
        searchResultsPageTracksLineupActions.fetchLineupMetadatas(
          offset,
          limit,
          overwrite,
          {
            category,
            query,
            filters,
            dispatch
          }
        )
      )
    },
    [dispatch, searchParams]
  )

  const loadMore = useCallback(
    (offset: number, limit: number) => {
      getResults(offset, limit, false)
    },
    [getResults]
  )
  const handleClickTrackTile = useCallback(
    (id?: number) => {
      if (id) {
        dispatch(
          addRecentSearch({
            searchItem: {
              kind: Kind.TRACKS,
              id
            }
          })
        )
      }
      dispatch(
        make(Name.SEARCH_RESULT_SELECT, {
          searchText: searchParams.query,
          kind: 'track',
          id,
          source: 'search results page'
        })
      )
    },
    [dispatch, searchParams]
  )

  if (
    (!lineup || lineup.entries.length === 0) &&
    lineup.status === Status.SUCCESS
  ) {
    return <NoResultsTile />
  }

  return (
    <Flex gap='l'>
      {!isLoading ? (
        <Lineup
          loadMore={loadMore}
          scrollParent={mainContentRef.current}
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
          lineup={lineup}
          playingSource={currentQueueItem.source}
          playingUid={currentQueueItem.uid}
          playingTrackId={
            currentQueueItem.track && currentQueueItem.track.track_id
          }
          playing={playing}
          buffering={buffering}
          playTrack={(uid, trackId) => {
            handleClickTrackTile(trackId)
            dispatch(searchResultsPageTracksLineupActions.play(uid))
          }}
          pauseTrack={() =>
            dispatch(searchResultsPageTracksLineupActions.pause())
          }
          actions={searchResultsPageTracksLineupActions}
          onClickTile={handleClickTrackTile}
        />
      ) : (
        <Flex direction='column' gap='l' w='100%'>
          {range(5).map((_, i) => (
            <LineupTileSkeleton key={`lineup-tile-skeleton-${i}`} />
          ))}
        </Flex>
      )}
    </Flex>
  )
}

export const TrackResultsPage = () => {
  const isMobile = useIsMobile()
  const [tracksLayout, setTracksLayout] = useState<ViewLayout>('list')
  const updateSortParam = useUpdateSearchParams('sortMethod')

  const searchParams = useSearchParams()
  const { sortMethod } = searchParams

  return (
    <Flex direction='column' gap='xl' wrap='wrap'>
      {!isMobile ? (
        <Flex justifyContent='space-between' alignItems='center'>
          <Text variant='heading' textAlign='left'>
            {messages.tracks}
          </Text>
          <Flex gap='s'>
            <OptionsFilterButton
              selection={sortMethod ?? 'relevant'}
              variant='replaceLabel'
              optionsLabel={messages.sortOptionsLabel}
              onChange={updateSortParam}
              options={[
                { label: 'Most Relevant', value: 'relevant' },
                { label: 'Most Popular', value: 'popular' },
                { label: 'Most Recent', value: 'recent' }
              ]}
            />
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
        </Flex>
      ) : null}
      <TrackResults />
    </Flex>
  )
}
