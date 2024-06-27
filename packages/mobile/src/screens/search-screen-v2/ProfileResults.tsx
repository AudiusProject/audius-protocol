import { UserList } from 'app/components/user-list'
import { useGetSearchResults } from './searchState'
import { Status } from '@audius/common/models'

export const ProfileResults = () => {
  const { data, status } = useGetSearchResults('users')
  console.log('resulting data', data)
  return <UserList profiles={data} isLoading={status === Status.LOADING} />
}
