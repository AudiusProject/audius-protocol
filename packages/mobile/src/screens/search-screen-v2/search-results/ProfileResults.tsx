import { Status } from '@audius/common/models'
import { isEmpty } from 'lodash'

import { UserList } from 'app/components/user-list'

import { NoResultsTile } from '../NoResultsTile'
import { SearchCatalogTile } from '../SearchCatalogTile'
import {
  useGetSearchResults,
  useSearchFilters,
  useSearchQuery
} from '../searchState'

export const ProfileResults = () => {
  const { data, status } = useGetSearchResults('users')
  const [query] = useSearchQuery()
  const [filters] = useSearchFilters()
  const isNoSearch = !query && isEmpty(filters)

  if (isNoSearch) return <SearchCatalogTile />
  if ((!data || data.length === 0) && status === Status.SUCCESS) {
    return <NoResultsTile />
  }

  return <UserList profiles={data} isLoading={status === Status.LOADING} />
}
