import { useSupportedUsers } from '@audius/common/api'

import { IconTipping } from '@audius/harmony-native'
import { useRoute } from 'app/hooks/useRoute'

import { UserListScreen } from './UserListScreen'
import { UserListV2 } from './UserListV2'
const messages = {
  title: 'Supporting'
}

export const SupportingUsersScreen = () => {
  const { params } = useRoute<'SupportingUsers'>()
  const { userId } = params
  const { data, isFetchingNextPage, isPending, fetchNextPage } =
    useSupportedUsers({ userId })

  return (
    <UserListScreen title={messages.title} titleIcon={IconTipping}>
      <UserListV2
        data={data?.map((supporter) => supporter.receiver)}
        isFetchingNextPage={isFetchingNextPage}
        isPending={isPending}
        fetchNextPage={fetchNextPage}
        tag='SUPPORTING'
      />
    </UserListScreen>
  )
}
