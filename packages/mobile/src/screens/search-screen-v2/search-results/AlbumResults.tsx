import { Status } from '@audius/common/models'
import { isEmpty } from 'lodash'

import { Flex } from '@audius/harmony-native'
import { CollectionList } from 'app/components/collection-list/CollectionList'

import { NoResultsTile } from '../NoResultsTile'
import { SearchCatalogTile } from '../SearchCatalogTile'
import {
  useGetSearchResults,
  useSearchFilters,
  useSearchQuery
} from '../searchState'

export const AlbumResults = () => {
  const { data, status } = useGetSearchResults('albums')
  const [query] = useSearchQuery()
  const [filters] = useSearchFilters()
  const isNoSearch = !query && isEmpty(filters)

  if (isNoSearch) return <SearchCatalogTile />
  if ((!data || data.length === 0) && status === Status.SUCCESS) {
    return <NoResultsTile />
  }

  return (
    <Flex h='100%' backgroundColor='default' pt='m'>
      <CollectionList
        isLoading={status === Status.LOADING}
        collection={data as any[]}
      />
    </Flex>
  )
}
