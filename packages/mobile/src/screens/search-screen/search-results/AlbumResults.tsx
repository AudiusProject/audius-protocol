import { Kind, Status } from '@audius/common/models'
import { searchActions } from '@audius/common/store'
import { useDispatch } from 'react-redux'

import { Flex, useTheme } from '@audius/harmony-native'
import { CollectionList } from 'app/components/collection-list/CollectionList'

import { NoResultsTile } from '../NoResultsTile'
import { SearchCatalogTile } from '../SearchCatalogTile'
import { useGetSearchResults, useIsEmptySearch } from '../searchState'

const { addItem: addRecentSearch } = searchActions

export const AlbumResults = () => {
  const dispatch = useDispatch()
  const { spacing } = useTheme()
  const { data, status } = useGetSearchResults('albums')
  const isEmptySearch = useIsEmptySearch()
  const hasNoResults = (!data || data.length === 0) && status === Status.SUCCESS

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
          isLoading={status === Status.LOADING}
          collection={data as any[]}
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
