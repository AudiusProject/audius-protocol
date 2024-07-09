import { Status } from '@audius/common/models'

import { Flex } from '@audius/harmony-native'
import { CollectionList } from 'app/components/collection-list/CollectionList'

import { NoResultsTile } from '../NoResultsTile'
import { SearchCatalogTile } from '../SearchCatalogTile'
import { useGetSearchResults, useIsEmptySearch } from '../searchState'

export const AlbumResults = () => {
  const { data, status } = useGetSearchResults('albums')
  const isEmptySearch = useIsEmptySearch()
  const hasNoResults = (!data || data.length === 0) && status === Status.SUCCESS

  if (isEmptySearch) return <SearchCatalogTile />

  return (
    <Flex h='100%' backgroundColor='default' pt='m'>
      {hasNoResults ? (
        <NoResultsTile />
      ) : (
        <CollectionList
          isLoading={status === Status.LOADING}
          collection={data as any[]}
        />
      )}
    </Flex>
  )
}
