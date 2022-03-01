import { useMemo } from 'react'

import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { CollectionList } from '../../components/collection-list/CollectionList'

import { useEmptyProfileText } from './EmptyProfileTile'
import { getProfile } from './selectors'

export const AlbumsTab = () => {
  const { profile, albums } = useSelectorWeb(getProfile)

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
    />
  )
}
