import { useRelatedArtists } from '@audius/common/api'
import { relatedArtistsUserListSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { UserList } from 'components/user-list/UserList'

export const RelatedArtistsUserList = () => {
  const userId = useSelector(relatedArtistsUserListSelectors.getId)
  const query = useRelatedArtists({ artistId: userId })

  return <UserList {...query} />
}
