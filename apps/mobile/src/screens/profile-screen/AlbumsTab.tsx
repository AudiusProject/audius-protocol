import { profilePageSelectors } from '@audius/common'
import { useSelector } from 'react-redux'

import { CollectionList } from 'app/components/collection-list/CollectionList'

import { useEmptyProfileText } from './EmptyProfileTile'
const { getProfileAlbums } = profilePageSelectors

export const AlbumsTab = () => {
  const albums = useSelector(getProfileAlbums)

  const emptyListText = useEmptyProfileText('albums')

  return (
    <CollectionList
      listKey='profile-albums'
      collection={albums}
      emptyListText={emptyListText}
      disableTopTabScroll
      showsVerticalScrollIndicator={false}
    />
  )
}
