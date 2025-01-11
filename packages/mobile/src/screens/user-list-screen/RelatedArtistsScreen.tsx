import { useRelatedArtists } from '@audius/common/api'
import { RELATED_ARTISTS_USER_LIST_TAG } from '@audius/common/store'

import { IconUserGroup } from '@audius/harmony-native'
import { useProfileRoute } from 'app/hooks/useRoute'

import { UserListScreen } from './UserListScreen'
import { UserListV2 } from './UserListV2'

const messages = {
  title: 'Related Artists'
}

export const RelatedArtistsScreen = () => {
  const { params } = useProfileRoute<'RelatedArtists'>()
  const { userId } = params
  const query = useRelatedArtists({ artistId: userId })

  return (
    <UserListScreen title={messages.title} titleIcon={IconUserGroup}>
      <UserListV2 {...query} tag={RELATED_ARTISTS_USER_LIST_TAG} />
    </UserListScreen>
  )
}
