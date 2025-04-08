import { useRelatedArtists } from '@audius/common/api'
import { relatedArtistsUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserList } from '../UserList'

export const RelatedArtistsUserList = () => {
  const userId = useSelector(relatedArtistsUserListSelectors.getId)
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage, isPending } =
    useRelatedArtists({ artistId: userId })

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
