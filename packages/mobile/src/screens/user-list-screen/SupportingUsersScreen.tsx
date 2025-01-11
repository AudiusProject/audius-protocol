import { useSupportedUsers } from '@audius/common/api'

import { IconTipping } from '@audius/harmony-native'
import { useRoute } from 'app/hooks/useRoute'

import { UserList } from './UserList'
import { UserListScreen } from './UserListScreen'

const messages = {
  title: 'Supporting'
}

export const SupportingUsersScreen = () => {
  const { params } = useRoute<'SupportingUsers'>()
  const { userId } = params
  const query = useSupportedUsers({ userId })

  return (
    <UserListScreen title={messages.title} titleIcon={IconTipping}>
      <UserList
        {...query}
        data={query.data?.map((supporter) => supporter.receiver)}
        tag='SUPPORTING'
      />
    </UserListScreen>
  )
}
