import { useCallback } from 'react'

import type { ID } from '@audius/common/models'
import { Kind, Name } from '@audius/common/models'
import { searchActions } from '@audius/common/store'
import { useDispatch } from 'react-redux'

import { Flex, useTheme } from '@audius/harmony-native'
import { CollectionList } from 'app/components/collection-list/CollectionList'
import { make, track as record } from 'app/services/analytics'

import { NoResultsTile } from '../NoResultsTile'
import { SearchCatalogTile } from '../SearchCatalogTile'
import {
  useGetSearchResults,
  useIsEmptySearch,
  useSearchQuery
} from '../searchState'

const { addItem: addRecentSearch } = searchActions

export const PlaylistResults = () => {
  const dispatch = useDispatch()
  const { spacing } = useTheme()
  const {
    data: playlists,
    isLoading,
    isSuccess
  } = useGetSearchResults('playlists')
  const [query] = useSearchQuery()
  const isEmptySearch = useIsEmptySearch()
  const hasNoResults = (!playlists || playlists.length === 0) && isSuccess

  const handlePress = useCallback(
    (id: ID) => {
      dispatch(
        addRecentSearch({
          searchItem: {
            kind: Kind.COLLECTIONS,
            id
          }
        })
      )

      record(
        make({
          eventName: Name.SEARCH_RESULT_SELECT,
          term: query,
          source: 'search results page',
          id,
          kind: 'playlist'
        })
      )
    },
    [dispatch, query]
  )

  if (isEmptySearch) return <SearchCatalogTile />

  return (
    <Flex h='100%' backgroundColor='default'>
      {hasNoResults ? (
        <NoResultsTile />
      ) : (
        <CollectionList
          style={{
            height: '100%',
            paddingVertical: spacing.m
          }}
          keyboardShouldPersistTaps='handled'
          isLoading={isLoading}
          collection={playlists}
          onCollectionPress={handlePress}
        />
      )}
    </Flex>
  )
}
