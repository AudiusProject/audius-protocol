import { profilePageSelectors } from '@audius/common'
import { useSelector } from 'react-redux'

import { CollectionList } from 'app/components/collection-list'

import { EmptyProfileTile } from './EmptyProfileTile'
import { useSelectProfile } from './selectors'
const { getProfilePlaylists } = profilePageSelectors

export const PlaylistsTab = () => {
  const { handle } = useSelectProfile(['handle'])
  const playlists = useSelector((state) => getProfilePlaylists(state, handle))

  return (
    <CollectionList
      listKey='profile-playlists'
      collection={playlists}
      ListEmptyComponent={<EmptyProfileTile tab='playlists' />}
      disableTopTabScroll
      showsVerticalScrollIndicator={false}
    />
  )
}
