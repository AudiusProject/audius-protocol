import { useRelatedArtists } from '@audius/common/api'
import { relatedArtistsUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserListV2 } from 'components/user-list/UserListV2'

export const RelatedArtistsUserList = () => {
  const userId = useSelector(relatedArtistsUserListSelectors.getId)
  const query = useRelatedArtists({ artistId: userId })

  return <UserListV2 {...query} />
}
