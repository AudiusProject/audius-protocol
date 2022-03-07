import { useMemo } from 'react'

import { CollectionList } from 'app/components/collection-list'

import { useEmptyProfileText } from './EmptyProfileTile'
import { useProfilePlaylists } from './selectors'

export const PlaylistsTab = () => {
  const { profile, playlists } = useProfilePlaylists()

  const userPlaylists = useMemo(() => {
    if (profile && playlists) {
      return playlists.map(album => ({ ...album, user: profile }))
    }
  }, [profile, playlists])

  const emptyListText = useEmptyProfileText(profile, 'playlists')

  if (!userPlaylists) return null

  return (
    <CollectionList
      listKey='profile-playlists'
      collection={userPlaylists}
      emptyListText={emptyListText}
      disableTopTabScroll
    />
  )
}
