import { useReposts } from '@audius/common/api'
import { RepostType } from '@audius/common/store'

import { IconRepost } from '@audius/harmony-native'
import { useRoute } from 'app/hooks/useRoute'

import { UserListScreen } from './UserListScreen'
import { UserListV2 } from './UserListV2'

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
      <UserListV2 {...query} tag='REPOSTS' />
    </UserListScreen>
  )
}
