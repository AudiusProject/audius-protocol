import { useRelatedArtists } from '@audius/common/api'
import { relatedArtistsUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserListV2 } from '../UserListV2'

export const RelatedArtistsUserList = () => {
  const userId = useSelector(relatedArtistsUserListSelectors.getId)
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage, isPending } =
    useRelatedArtists({ artistId: userId })

  return (
    <UserListV2
      data={data}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isPending={isPending}
      fetchNextPage={fetchNextPage}
    />
  )
}
