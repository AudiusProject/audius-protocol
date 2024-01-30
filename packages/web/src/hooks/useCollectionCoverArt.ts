import {
  cacheCollectionsActions,
  imageBlank as imageEmpty
} from '@audius/common'
import { useImageSize } from '@audius/common/hooks'
import { SquareSizes, CoverArtSizes } from '@audius/common/models'
import { useDispatch } from 'react-redux'

const { fetchCoverArt } = cacheCollectionsActions

export const useCollectionCoverArt = (
  collectionId: number | null | undefined,
  coverArtSizes: CoverArtSizes | null,
  size: SquareSizes,
  defaultImage: string = imageEmpty as string
) => {
  const dispatch = useDispatch()
  return useImageSize({
    dispatch,
    id: collectionId,
    sizes: coverArtSizes,
    size,
    action: fetchCoverArt,
    defaultImage
  })
}
