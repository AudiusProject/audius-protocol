import { useMemo } from 'react'

import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { CollectionList } from '../../components/collection-list/CollectionList'

import { getProfile } from './selectors'

const messages = {
  emptyTabText: "You haven't created any albums yet"
}

export const AlbumsTab = () => {
  const { profile, albums } = useSelectorWeb(getProfile)

  const userAlbums = useMemo(() => {
    if (profile && albums) {
      return albums.map(album => ({ ...album, user: profile }))
    }
  }, [profile, albums])

  if (!userAlbums) return null

  return (
    <CollectionList
      collection={userAlbums}
      emptyTabText={messages.emptyTabText}
    />
  )
}
