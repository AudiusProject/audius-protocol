import { Status } from '@audius/common/models'

import { UserList } from 'app/components/user-list'

import { useGetSearchResults } from '../searchState'

export const ProfileResults = () => {
  const { data, status } = useGetSearchResults('users')
  return <UserList profiles={data} isLoading={status === Status.LOADING} />
}
