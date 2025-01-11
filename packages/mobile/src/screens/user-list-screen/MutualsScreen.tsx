import { useMutualFollowers } from '@audius/common/api'
import { MUTUALS_USER_LIST_TAG } from '@audius/common/store'

import { IconUserFollowing } from '@audius/harmony-native'
import { useProfileRoute } from 'app/hooks/useRoute'

import { UserListScreen } from './UserListScreen'
import { UserListV2 } from './UserListV2'

const messages = {
  title: 'Mutuals'
}

export const MutualsScreen = () => {
  const { params } = useProfileRoute<'Mutuals'>()
  const { userId } = params
  const query = useMutualFollowers({ userId })

  return (
    <UserListScreen title={messages.title} titleIcon={IconUserFollowing}>
      <UserListV2 {...query} tag={MUTUALS_USER_LIST_TAG} />
    </UserListScreen>
  )
}
