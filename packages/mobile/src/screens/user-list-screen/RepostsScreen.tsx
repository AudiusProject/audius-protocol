import { useReposts } from '@audius/common/api'
import { RepostType } from '@audius/common/store'

import { IconRepost } from '@audius/harmony-native'
import { useRoute } from 'app/hooks/useRoute'

import { UserList } from './UserList'
import { UserListScreen } from './UserListScreen'

const messages = {
  title: 'Reposts'
}

export const RepostsScreen = () => {
  const { params } = useRoute<'Reposts'>()
  const { id, repostType } = params

  const query = useReposts(
    { trackId: id },
    { enabled: repostType === RepostType.TRACK }
  )

  return (
    <UserListScreen title={messages.title} titleIcon={IconRepost}>
      <UserList {...query} tag='REPOSTS' />
    </UserListScreen>
  )
}
