import { useCallback, useEffect, useState } from 'react'

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
import { FilterButton, Flex, Text, useTheme } from '@audius/harmony'
import { css } from '@emotion/css'
import { useDispatch, useSelector } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import Lineup from 'components/lineup/Lineup'
import { LineupVariant } from 'components/lineup/types'
import { useIsMobile } from 'hooks/useIsMobile'
import { useMainContentRef } from 'pages/MainContentContext'

import { NoResultsTile } from '../NoResultsTile'
import { SortMethodFilterButton } from '../SortMethodFilterButton'
import { useSearchParams } from '../hooks'
import { ViewLayout, viewLayoutOptions } from '../types'
import { ALL_RESULTS_LIMIT } from '../utils'

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
  count?: number
}

export const TrackResults = (props: TrackResultsProps) => {
  const { category = 'tracks', viewLayout = 'list', count } = props
  const mainContentRef = useMainContentRef()
  const isMobile = useIsMobile()

  const dispatch = useDispatch()
  const currentQueueItem = useSelector(getCurrentQueueItem)
  const playing = useSelector(getPlaying)
  const buffering = useSelector(getBuffering)

  const isTrackGridLayout = viewLayout === 'grid'

  const lineup = useSelector(getSearchTracksLineupMetadatas)

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
    [dispatch, searchParams, category]
  )
  useEffect(() => {
    dispatch(searchResultsPageTracksLineupActions.reset())
    getResults(0, ALL_RESULTS_LIMIT, true)
  }, [dispatch, searchParams, getResults])

  const loadMore = useCallback(
    (offset: number, limit: number) => {
      // Only load more if some results have already been loaded
      if (!lineup.entries.length) {
        return
      }
      getResults(offset, limit, false)
    },
    [getResults, lineup]
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
    <Lineup
      variant={viewLayout === 'grid' ? LineupVariant.GRID : LineupVariant.MAIN}
      count={count}
      loadMore={loadMore}
      scrollParent={mainContentRef.current}
      lineup={lineup}
      playingSource={currentQueueItem.source}
      playingUid={currentQueueItem.uid}
      playingTrackId={currentQueueItem.track && currentQueueItem.track.track_id}
      playing={playing}
      buffering={buffering}
      playTrack={(uid, trackId) => {
        handleClickTrackTile(trackId)
        dispatch(searchResultsPageTracksLineupActions.play(uid))
      }}
      pauseTrack={() => dispatch(searchResultsPageTracksLineupActions.pause())}
      actions={searchResultsPageTracksLineupActions}
      onClickTile={handleClickTrackTile}
      {...(!isMobile
        ? {
            lineupContainerStyles: css({ width: '100%' }),
            tileContainerStyles: css({
              display: 'grid',
              gridTemplateColumns: isTrackGridLayout ? '1fr 1fr' : '1fr',
              gap: '4px 16px',
              justifyContent: 'space-between'
            }),
            tileStyles: css({
              maxWidth: isTrackGridLayout ? HALF_TILE_WIDTH : PAGE_WIDTH
            })
          }
        : {})}
    />
  )
}

export const TrackResultsPage = () => {
  const isMobile = useIsMobile()
  const { color } = useTheme()

  const [tracksLayout, setTracksLayout] = useState<ViewLayout>('list')

  return !isMobile ? (
    <Flex direction='column' gap='xl' wrap='wrap'>
      <Flex justifyContent='space-between' alignItems='center'>
        <Text variant='heading' textAlign='left'>
          {messages.tracks}
        </Text>
        <Flex gap='s'>
          <SortMethodFilterButton />
          <FilterButton
            value={tracksLayout}
            variant='replaceLabel'
            optionsLabel={messages.layoutOptionsLabel}
            onChange={setTracksLayout}
            options={viewLayoutOptions}
          />
        </Flex>
      </Flex>
      <TrackResults viewLayout={tracksLayout} />
    </Flex>
  ) : (
    <Flex p='m' css={{ backgroundColor: color.background.default }}>
      <TrackResults />
    </Flex>
  )
}
