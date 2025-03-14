import { useTrackReposts, useCollectionReposts } from '@audius/common/api'
import { repostsUserListSelectors, RepostType } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserList } from '../UserList'

export const RepostsUserList = () => {
  const entityId = useSelector(repostsUserListSelectors.getId)
  const entityType = useSelector(repostsUserListSelectors.getRepostsType)

  const trackQuery = useTrackReposts(
    { trackId: entityId },
    { enabled: entityType === RepostType.TRACK }
  )

  const collectionQuery = useCollectionReposts(
    { collectionId: entityId },
    { enabled: entityType === RepostType.COLLECTION }
  )

  const { data, hasNextPage, isFetchingNextPage, fetchNextPage, isPending } =
    entityType === RepostType.TRACK ? trackQuery : collectionQuery

  return (
    <UserList
      data={data}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isPending={isPending}
      fetchNextPage={fetchNextPage}
    />
  )
}
