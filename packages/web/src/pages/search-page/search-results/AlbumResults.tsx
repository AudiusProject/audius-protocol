import { useCallback } from 'react'

import {
  FlatUseInfiniteQueryResult,
  useSearchAlbumResults
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
  albums: 'Albums'
}

type AlbumResultsProps = {
  queryData: Omit<FlatUseInfiniteQueryResult<UserCollectionMetadata>, 'status'>
  limit?: number
  skeletonCount?: number
}

export const AlbumResults = (props: AlbumResultsProps) => {
  const { limit = 100, skeletonCount = 10, queryData } = props
  const { data: albums = [] } = queryData
  const searchParams = useSearchParams()
  const { query } = searchParams

  const isMobile = useIsMobile()
  const dispatch = useDispatch()

  const truncatedResults = albums?.slice(0, limit) ?? []

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
      }
      dispatch(
        make(Name.SEARCH_RESULT_SELECT, {
          term: query,
          source: 'search results page',
          id,
          kind: 'playlist'
        })
      )
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
        : truncatedResults.map((album) => (
            <CollectionCard
              key={album.playlist_id}
              id={album.playlist_id}
              size={isMobile ? 'xs' : 's'}
              css={isMobile ? { maxWidth: 320 } : undefined}
              onClick={() => handleClick(album.playlist_id)}
              onCollectionLinkClick={() => handleClick(album.playlist_id)}
            />
          ))}
    </Box>
  )
}

export const AlbumResultsPage = () => {
  const isMobile = useIsMobile()
  const { color } = useTheme()

  const searchParams = useSearchParams()
  const queryData = useSearchAlbumResults(searchParams)
  const { data, isLoading } = queryData

  const isResultsEmpty = data?.length === 0
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
            {messages.albums}
          </Text>
          <SortMethodFilterButton />
        </Flex>
      ) : null}
      {showNoResultsTile ? (
        <NoResultsTile />
      ) : (
        <AlbumResults queryData={queryData} />
      )}
    </Flex>
  )
}
