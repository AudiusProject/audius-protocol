import { useMemo } from 'react'

import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { CollectionList } from '../../components/collection-list/CollectionList'

import { getProfile } from './selectors'

const messages = {
  emptyTabText: "You haven't created any playlists yet"
}

export const PlaylistsTab = () => {
  const { profile, playlists } = useSelectorWeb(getProfile)

  const userPlaylists = useMemo(() => {
    if (profile && playlists) {
      return playlists.map(album => ({ ...album, user: profile }))
    }
  }, [profile, playlists])

  if (!userPlaylists) return null

  return (
    <CollectionList
      collection={userPlaylists}
      emptyTabText={messages.emptyTabText}
    />
  )
}
