import { useTrackReposts, useCollectionReposts } from '@audius/common/api'
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

  const trackQuery = useTrackReposts(
    { trackId: id },
    { enabled: repostType === RepostType.TRACK }
  )

  const collectionQuery = useCollectionReposts(
    { collectionId: id },
    { enabled: repostType === RepostType.COLLECTION }
  )

  const { data, isFetchingNextPage, isPending, fetchNextPage } =
    repostType === RepostType.TRACK ? trackQuery : collectionQuery

  return (
    <UserListScreen title={messages.title} titleIcon={IconRepost}>
      <UserList
        data={data}
        isFetchingNextPage={isFetchingNextPage}
        isPending={isPending}
        fetchNextPage={fetchNextPage}
        tag='REPOSTS'
      />
    </UserListScreen>
  )
}
