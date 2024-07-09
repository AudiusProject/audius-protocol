import { Status } from '@audius/common/models'

import { UserList } from 'app/components/user-list'

import { NoResultsTile } from '../NoResultsTile'
import { SearchCatalogTile } from '../SearchCatalogTile'
import { useGetSearchResults, useIsEmptySearch } from '../searchState'

export const ProfileResults = () => {
  const { data, status } = useGetSearchResults('users')
  const isEmptySearch = useIsEmptySearch()
  const hasNoResults = (!data || data.length === 0) && status === Status.SUCCESS

  if (isEmptySearch) return <SearchCatalogTile />
  if (hasNoResults) return <NoResultsTile />

  return <UserList profiles={data} isLoading={status === Status.LOADING} />
}
