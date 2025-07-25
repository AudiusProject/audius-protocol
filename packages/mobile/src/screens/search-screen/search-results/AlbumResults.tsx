import { useSearchAlbumResults } from '@audius/common/api'
import { Kind } from '@audius/common/models'
import { searchActions } from '@audius/common/store'
import { useDispatch } from 'react-redux'

import { Flex, useTheme } from '@audius/harmony-native'
import { CollectionList } from 'app/components/collection-list/CollectionList'

import { NoResultsTile } from '../NoResultsTile'
import { SearchCatalogTile } from '../SearchCatalogTile'
import {
  useIsEmptySearch,
  useSearchQuery,
  useSearchFilters
} from '../searchState'

const { addItem: addRecentSearch } = searchActions

export const AlbumResults = () => {
  const dispatch = useDispatch()
  const { spacing } = useTheme()
  const [query] = useSearchQuery()
  const [filters] = useSearchFilters()
  const {
    data: albums,
    isLoading,
    isSuccess
  } = useSearchAlbumResults({
    query,
    ...filters
  })
  const isEmptySearch = useIsEmptySearch()
  const hasNoResults = (!albums || albums.length === 0) && isSuccess

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
          ListFooterComponent={<Flex h={200} />}
          keyboardShouldPersistTaps='handled'
          isLoading={isLoading}
          collection={albums}
          onCollectionPress={(id) => {
            dispatch(
              addRecentSearch({
                searchItem: {
                  kind: Kind.COLLECTIONS,
                  id
                }
              })
            )
          }}
        />
      )}
    </Flex>
  )
}
