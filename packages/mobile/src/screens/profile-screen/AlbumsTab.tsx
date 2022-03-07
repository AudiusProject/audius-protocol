import { useMemo } from 'react'

import { CollectionList } from 'app/components/collection-list/CollectionList'

import { useEmptyProfileText } from './EmptyProfileTile'
import { useProfileAlbums } from './selectors'

export const AlbumsTab = () => {
  const { profile, albums } = useProfileAlbums()

  const userAlbums = useMemo(() => {
    if (profile && albums) {
      return albums.map(album => ({ ...album, user: profile }))
    }
  }, [profile, albums])

  const emptyListText = useEmptyProfileText(profile, 'albums')

  if (!userAlbums) return null

  return (
    <CollectionList
      listKey='profile-albums'
      collection={userAlbums}
      emptyListText={emptyListText}
      disableTopTabScroll
    />
  )
}
