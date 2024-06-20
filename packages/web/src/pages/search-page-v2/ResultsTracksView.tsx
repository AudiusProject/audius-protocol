import { useCallback, useState } from 'react'

import { Name, Status } from '@audius/common/models'
import {
  lineupSelectors,
  playerSelectors,
  queueSelectors,
  searchResultsPageSelectors,
  searchResultsPageTracksLineupActions
} from '@audius/common/store'
import { Flex, OptionsFilterButton, Text } from '@audius/harmony'
import { css } from '@emotion/css'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom-v5-compat'

import { make } from 'common/store/analytics/actions'
import Lineup from 'components/lineup/Lineup'
import { LineupVariant } from 'components/lineup/types'
import { useRouteMatch } from 'hooks/useRouteMatch'
import { SEARCH_PAGE } from 'utils/route'

import { NoResultsTile } from './NoResultsTile'
import { CategoryView, ViewLayout, viewLayoutOptions } from './types'
import { useUpdateSearchParams } from './utils'

const { makeGetLineupMetadatas } = lineupSelectors
const { getBuffering, getPlaying } = playerSelectors
const { getSearchResults, getSearchTracksLineup } = searchResultsPageSelectors
const { makeGetCurrent } = queueSelectors

const PAGE_WIDTH = 1080
const HALF_TILE_WIDTH = (PAGE_WIDTH - 16) / 2

const messages = {
  tracks: 'Tracks',
  layoutOptionsLabel: 'View As',
  sortOptionsLabel: 'Sort By'
}

const getCurrentQueueItem = makeGetCurrent()
const getTracksLineup = makeGetLineupMetadatas(getSearchTracksLineup)

export const ResultsTracksView = () => {
  const dispatch = useDispatch()
  const [tracksLayout, setTracksLayout] = useState<ViewLayout>('list')
  const results = useSelector(getSearchResults)
  const currentQueueItem = useSelector(getCurrentQueueItem)
  const playing = useSelector(getPlaying)
  const buffering = useSelector(getBuffering)
  const tracksLineup = useSelector(getTracksLineup)
  const [urlSearchParams] = useSearchParams()
  const updateSortParam = useUpdateSearchParams('sort')
  const routeMatch = useRouteMatch<{ category: string }>(SEARCH_PAGE)
  const isCategoryActive = useCallback(
    (category: CategoryView) => routeMatch?.category === category,
    [routeMatch]
  )

  const isTrackGridLayout =
    !isCategoryActive(CategoryView.TRACKS) || tracksLayout === 'grid'
  const isLoading = results.status === Status.LOADING
  const query = urlSearchParams.get('query')
  const sort = urlSearchParams.get('sort')
  const trackLimit = isCategoryActive(CategoryView.TRACKS) ? 100 : 10
  const trackIds = results.trackIds?.slice(0, trackLimit) ?? []
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

  return (
    <Flex direction='column' gap='xl' wrap='wrap'>
      <Flex justifyContent='space-between' alignItems='center'>
        <Text variant='heading' textAlign='left'>
          {messages.tracks}
        </Text>
        {isCategoryActive(CategoryView.TRACKS) ? (
          <Flex gap='s'>
            <OptionsFilterButton
              selection={sort ?? 'relevant'}
              variant='replaceLabel'
              optionsLabel={messages.sortOptionsLabel}
              onChange={updateSortParam}
              options={[
                { label: 'Most Relevant', value: 'relevant' },
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
        ) : null}
      </Flex>
      {!isLoading && (!trackIds || trackIds.length === 0) ? (
        <NoResultsTile />
      ) : (
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
      )}
    </Flex>
  )
}
