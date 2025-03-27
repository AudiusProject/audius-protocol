import { useSupportedUsers, useUser } from '@audius/common/api'

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

  const { data: supportingCount } = useUser(userId, {
    select: (user) => user.supporting_count
  })

  const { data, isFetchingNextPage, isPending, fetchNextPage } =
    useSupportedUsers({ userId })

  return (
    <UserListScreen title={messages.title} titleIcon={IconTipping}>
      <UserList
        data={data?.map((supporter) => supporter.receiver.user_id)}
        totalCount={supportingCount}
        isFetchingNextPage={isFetchingNextPage}
        isPending={isPending}
        fetchNextPage={fetchNextPage}
        tag='SUPPORTING'
      />
    </UserListScreen>
  )
}
