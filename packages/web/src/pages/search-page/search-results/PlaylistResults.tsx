import { useCallback } from 'react'

import { ID, Kind, Name, Status } from '@audius/common/models'
import { searchActions } from '@audius/common/store'
import { Box, Flex, Text, useTheme } from '@audius/harmony'
import { range } from 'lodash'
import { useDispatch } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import { CollectionCard } from 'components/collection'
import { useIsMobile } from 'hooks/useIsMobile'

import { NoResultsTile } from '../NoResultsTile'
import { SortMethodFilterButton } from '../SortMethodFilterButton'
import { useGetSearchResults, useSearchParams } from '../hooks'

const { addItem: addRecentSearch } = searchActions

const messages = {
  playlists: 'Playlists',
  sortOptionsLabel: 'Sort By'
}

type PlaylistResultsProps = {
  ids: ID[]
  limit?: number
  skeletonCount?: number
}

export const PlaylistResults = (props: PlaylistResultsProps) => {
  const { limit = 100, ids, skeletonCount = 10 } = props
  const { query } = useSearchParams()

  const isMobile = useIsMobile()
  const dispatch = useDispatch()

  const truncatedIds = ids?.slice(0, limit) ?? []

  const handleClick = useCallback(
    (id?: number) => {
      if (id) {
        dispatch(
          addRecentSearch({
            searchItem: {
              kind: Kind.COLLECTIONS,
              id
            }
          })
        )
        dispatch(
          make(Name.SEARCH_RESULT_SELECT, {
            term: query,
            source: 'search results page',
            id,
            kind: 'playlist'
          })
        )
      }
    },
    [dispatch, query]
  )

  return (
    <Box
      css={{
        display: 'grid',
        gridTemplateColumns: isMobile
          ? 'repeat(auto-fill, minmax(150px, 1fr))'
          : 'repeat(auto-fill, 200px)',
        justifyContent: 'space-between',
        gap: 16
      }}
      p={isMobile ? 'm' : undefined}
    >
      {!truncatedIds.length
        ? range(skeletonCount).map((_, i) => (
            <CollectionCard
              key={`user_card_sekeleton_${i}`}
              id={0}
              size={isMobile ? 'xs' : 's'}
              css={isMobile ? { maxWidth: 320 } : undefined}
              loading={true}
            />
          ))
        : truncatedIds.map((id) => (
            <CollectionCard
              key={id}
              id={id}
              size={isMobile ? 'xs' : 's'}
              css={isMobile ? { maxWidth: 320 } : undefined}
              onClick={() => handleClick(id)}
              onCollectionLinkClick={() => handleClick(id)}
            />
          ))}
    </Box>
  )
}

export const PlaylistResultsPage = () => {
  const isMobile = useIsMobile()
  const { color } = useTheme()

  const { data: ids, status } = useGetSearchResults('playlists')
  const isLoading = status === Status.LOADING

  const isResultsEmpty = ids?.length === 0
  const showNoResultsTile = !isLoading && isResultsEmpty

  return (
    <Flex
      direction='column'
      gap='xl'
      css={isMobile ? { backgroundColor: color.background.default } : {}}
    >
      {!isMobile ? (
        <Flex justifyContent='space-between' alignItems='center'>
          <Text variant='heading' textAlign='left'>
            {messages.playlists}
          </Text>
          <SortMethodFilterButton />
        </Flex>
      ) : null}
      {showNoResultsTile ? <NoResultsTile /> : <PlaylistResults ids={ids} />}
    </Flex>
  )
}
