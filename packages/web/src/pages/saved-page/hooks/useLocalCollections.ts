import {
  cacheCollectionsSelectors,
  savedPageSelectors,
  CommonState,
  CollectionType
} from '@audius/common/store'
import { useSelector } from 'react-redux'

const {
  getSelectedCategoryLocalAlbumAdds,
  getSelectedCategoryLocalAlbumRemovals,
  getSelectedCategoryLocalPlaylistAdds,
  getSelectedCategoryLocalPlaylistRemovals
} = savedPageSelectors
const { getCollections } = cacheCollectionsSelectors

type UseLocalCollectionsResult = {
  locallyAddedCollections: any[]
  locallyRemovedIds: Set<number>
}

export const useLocalCollections = (
  collectionType: CollectionType
): UseLocalCollectionsResult => {
  const locallyAddedCollections = useSelector((state: CommonState) => {
    const ids =
      collectionType === 'albums'
        ? getSelectedCategoryLocalAlbumAdds(state)
        : getSelectedCategoryLocalPlaylistAdds(state)
    const collectionsMap = getCollections(state, {
      ids
    })
    return ids.map((id) => collectionsMap[id])
  })

  const locallyRemovedIds = useSelector((state: CommonState) => {
    const ids =
      collectionType === 'albums'
        ? getSelectedCategoryLocalAlbumRemovals(state)
        : getSelectedCategoryLocalPlaylistRemovals(state)
    return new Set(ids)
  })

  return {
    locallyAddedCollections,
    locallyRemovedIds
  }
}
