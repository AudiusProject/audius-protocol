import { profilePageSelectors } from '@audius/common'
import { useSelector } from 'react-redux'

import { CollectionList } from 'app/components/collection-list'

import { useEmptyProfileText } from './EmptyProfileTile'
import { useSelectProfile } from './selectors'
const { getProfilePlaylists } = profilePageSelectors

export const PlaylistsTab = () => {
  const { handle } = useSelectProfile(['handle'])
  const playlists = useSelector((state) => getProfilePlaylists(state, handle))

  const emptyListText = useEmptyProfileText('playlists')

  return (
    <CollectionList
      listKey='profile-playlists'
      collection={playlists}
      emptyListText={emptyListText}
      disableTopTabScroll
      showsVerticalScrollIndicator={false}
    />
  )
}
