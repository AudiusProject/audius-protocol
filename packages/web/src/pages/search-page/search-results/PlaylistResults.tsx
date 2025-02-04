import { useCallback } from 'react'

import {
  FlatUseInfiniteQueryResult,
  usePlaylistSearchResults
} from '@audius/common/api'
import { Kind, Name, UserCollectionMetadata } from '@audius/common/models'
import { searchActions } from '@audius/common/store'
import { Box, Flex, Text, useTheme } from '@audius/harmony'
import { range } from 'lodash'
import { useDispatch } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import { CollectionCard } from 'components/collection'
import { useIsMobile } from 'hooks/useIsMobile'

import { NoResultsTile } from '../NoResultsTile'
import { SortMethodFilterButton } from '../SortMethodFilterButton'
import { useSearchParams } from '../hooks'

const { addItem: addRecentSearch } = searchActions

const messages = {
  playlists: 'Playlists',
  sortOptionsLabel: 'Sort By'
}

type PlaylistResultsProps = {
  limit?: number
  skeletonCount?: number
  queryData: Omit<FlatUseInfiniteQueryResult<UserCollectionMetadata>, 'status'>
}

export const PlaylistResults = (props: PlaylistResultsProps) => {
  const { limit = 100, skeletonCount = 10, queryData } = props
  const { data: playlists = [] } = queryData
  const searchParams = useSearchParams()
  const { query } = searchParams

  const isMobile = useIsMobile()
  const dispatch = useDispatch()

  const truncatedResults = playlists?.slice(0, limit) ?? []

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
      {!truncatedResults.length
        ? range(skeletonCount).map((_, i) => (
            <CollectionCard
              key={`user_card_sekeleton_${i}`}
              id={0}
              size={isMobile ? 'xs' : 's'}
              css={isMobile ? { maxWidth: 320 } : undefined}
              loading={true}
            />
          ))
        : truncatedResults.map((playlist) => (
            <CollectionCard
              key={playlist.playlist_id}
              id={playlist.playlist_id}
              size={isMobile ? 'xs' : 's'}
              css={isMobile ? { maxWidth: 320 } : undefined}
              onClick={() => handleClick(playlist.playlist_id)}
              onCollectionLinkClick={() => handleClick(playlist.playlist_id)}
            />
          ))}
    </Box>
  )
}

export const PlaylistResultsPage = () => {
  const isMobile = useIsMobile()
  const { color } = useTheme()

  const searchParams = useSearchParams()
  const queryData = usePlaylistSearchResults(searchParams)
  const { data: playlists, isLoading } = queryData

  const isResultsEmpty = playlists?.length === 0
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
      {showNoResultsTile ? (
        <NoResultsTile />
      ) : (
        <PlaylistResults queryData={queryData} />
      )}
    </Flex>
  )
}
