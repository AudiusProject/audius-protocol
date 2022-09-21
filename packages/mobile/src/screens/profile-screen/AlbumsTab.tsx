import { profilePageSelectors } from '@audius/common'
import { useSelector } from 'react-redux'

import { CollectionList } from 'app/components/collection-list/CollectionList'

import { useEmptyProfileText } from './EmptyProfileTile'
import { useSelectProfile } from './selectors'
const { getProfileAlbums } = profilePageSelectors

export const AlbumsTab = () => {
  const { handle } = useSelectProfile(['handle'])
  const albums = useSelector((state) => getProfileAlbums(state, handle))

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
