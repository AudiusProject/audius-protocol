import { useCallback, useState } from 'react'

import { SEARCH_PAGE_SIZE, useSearchTrackResults } from '@audius/common/api'
import { useFeatureFlag } from '@audius/common/hooks'
import { Kind, Name } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  searchResultsPageTracksLineupActions,
  searchActions,
  SearchKind
} from '@audius/common/store'
import { FilterButton, Flex, Text } from '@audius/harmony'
import { css } from '@emotion/css'
import { useDispatch } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import { TanQueryLineup } from 'components/lineup/TanQueryLineup'
import { LineupVariant } from 'components/lineup/types'
import { useIsMobile } from 'hooks/useIsMobile'
import { useMainContentRef } from 'pages/MainContentContext'

import { NoResultsTile } from '../NoResultsTile'
import { SortMethodFilterButton } from '../SortMethodFilterButton'
import { useSearchParams } from '../hooks'
import { ViewLayout, viewLayoutOptions } from '../types'

const { addItem: addRecentSearch } = searchActions

const messages = {
  tracks: 'Tracks',
  layoutOptionsLabel: 'View As',
  sortOptionsLabel: 'Sort By'
}

type TrackResultsProps = {
  isPending: boolean
  isFetching: boolean
  isError: boolean
  viewLayout?: ViewLayout
  category?: SearchKind
  count?: number
}

export const TrackResults = (props: TrackResultsProps) => {
  const {
    category = SearchKind.TRACKS,
    viewLayout = 'list',
    count,
    isPending,
    isFetching,
    isError
  } = props

  const mainContentRef = useMainContentRef()
  const isMobile = useIsMobile()

  const dispatch = useDispatch()

  const isTrackGridLayout = viewLayout === 'grid'

  const searchParams = useSearchParams()

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

  const { data, hasNextPage, loadNextPage, isPlaying, play, pause, lineup } =
    useSearchTrackResults(searchParams)

  return (
    <TanQueryLineup
      data={data}
      lineup={lineup}
      pageSize={SEARCH_PAGE_SIZE}
      isFetching={isFetching}
      isPending={isPending}
      isError={isError}
      hasNextPage={hasNextPage}
      loadNextPage={loadNextPage}
      isPlaying={isPlaying}
      play={play}
      pause={pause}
      variant={viewLayout === 'grid' ? LineupVariant.GRID : LineupVariant.MAIN}
      scrollParent={mainContentRef.current}
      actions={searchResultsPageTracksLineupActions}
      emptyElement={<NoResultsTile />}
      onClickTile={handleClickTrackTile}
      maxEntries={count}
      // Whenever this component is shown on the AllResults page - we don't want to infinite scroll
      shouldLoadMore={category === 'tracks'}
      {...(!isMobile
        ? {
            lineupContainerStyles: css({ width: '100%' }),
            tileContainerStyles: css({
              display: 'grid',
              gridTemplateColumns: isTrackGridLayout
                ? 'repeat(auto-fit, minmax(450px, 1fr))' // wrap columns to fit
                : '1fr',
              gap: '4px 16px',
              justifyContent: 'space-between'
            })
          }
        : {})}
    />
  )
}

type TrackResultsPageProps = {
  layout?: ViewLayout
}

export const TrackResultsPage = ({ layout }: TrackResultsPageProps) => {
  const isMobile = useIsMobile()
  const searchParams = useSearchParams()
  const { isPending, isFetching, isError } = useSearchTrackResults(searchParams)

  const [tracksLayout, setTracksLayout] = useState<ViewLayout>('list')
  const { isEnabled: isSearchExploreEnabled } = useFeatureFlag(
    FeatureFlags.SEARCH_EXPLORE
  )

  return !isMobile && isSearchExploreEnabled === false ? (
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
      <TrackResults
        viewLayout={tracksLayout}
        isPending={isPending}
        isFetching={isFetching}
        isError={isError}
      />
    </Flex>
  ) : (
    <Flex p={'l'} css={{ backgroundColor: 'default' }}>
      <TrackResults
        viewLayout={isSearchExploreEnabled ? layout : undefined}
        isPending={isPending}
        isFetching={isFetching}
        isError={isError}
      />
    </Flex>
  )
}
