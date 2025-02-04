import { useCallback, useState } from 'react'

import {
  LineupQueryData,
  SEARCH_PAGE_SIZE,
  useSearchAllResults,
  useTrackSearchResults
} from '@audius/common/api'
import { Kind, Name, UserTrackMetadata } from '@audius/common/models'
import {
  searchResultsPageTracksLineupActions,
  searchActions,
  SearchKind
} from '@audius/common/store'
import { FilterButton, Flex, Text, useTheme } from '@audius/harmony'
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

const PAGE_WIDTH = 1080
const HALF_TILE_WIDTH = (PAGE_WIDTH - 16) / 2

const messages = {
  tracks: 'Tracks',
  layoutOptionsLabel: 'View As',
  sortOptionsLabel: 'Sort By'
}

type TrackResultsProps = {
  queryData: LineupQueryData
  viewLayout?: ViewLayout
  category?: SearchKind
  count?: number
}

export const TrackResults = (props: TrackResultsProps) => {
  const { category = SearchKind.TRACKS, viewLayout = 'list', queryData } = props

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

  return (
    <TanQueryLineup
      pageSize={SEARCH_PAGE_SIZE}
      lineupQueryData={queryData}
      variant={viewLayout === 'grid' ? LineupVariant.GRID : LineupVariant.MAIN}
      scrollParent={mainContentRef.current}
      actions={searchResultsPageTracksLineupActions}
      emptyElement={<NoResultsTile />}
      onClickTile={handleClickTrackTile}
      // Whenever this component is shown on the AllResults page - we don't want to infinite scroll
      shouldLoadMore={category === 'tracks'}
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
  const searchParams = useSearchParams()
  const queryData = useTrackSearchResults(searchParams)

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
      <TrackResults viewLayout={tracksLayout} queryData={queryData} />
    </Flex>
  ) : (
    <Flex p='m' css={{ backgroundColor: color.background.default }}>
      <TrackResults queryData={queryData} />
    </Flex>
  )
}
