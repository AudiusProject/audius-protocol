import { profilePageSelectors } from '@audius/common'

import { CollectionList } from 'app/components/collection-list/CollectionList'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { useEmptyProfileText } from './EmptyProfileTile'
const { getProfileAlbums } = profilePageSelectors

export const AlbumsTab = () => {
  const albums = useSelectorWeb(getProfileAlbums)

  const emptyListText = useEmptyProfileText('albums')

  return (
    <CollectionList
      listKey='profile-albums'
      collection={albums}
      emptyListText={emptyListText}
      disableTopTabScroll
      fromPage='profile'
      showsVerticalScrollIndicator={false}
    />
  )
}
