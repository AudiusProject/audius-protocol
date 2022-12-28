import { profilePageSelectors } from '@audius/common'
import { useSelector } from 'react-redux'

import { CollectionList } from 'app/components/collection-list/CollectionList'

import { EmptyProfileTile } from './EmptyProfileTile'
import { useSelectProfile } from './selectors'
const { getProfileAlbums } = profilePageSelectors

export const AlbumsTab = () => {
  const { handle } = useSelectProfile(['handle'])
  const albums = useSelector((state) => getProfileAlbums(state, handle))

  return (
    <CollectionList
      listKey='profile-albums'
      collection={albums}
      ListEmptyComponent={<EmptyProfileTile tab='albums' />}
      disableTopTabScroll
      showsVerticalScrollIndicator={false}
    />
  )
}
