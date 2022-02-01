import { useDispatch } from 'react-redux'

import imageEmpty from 'common/assets/image/imageBlank2x.png'
import { useImageSize } from 'common/hooks/useImageSize'
import { CoverArtSizes, SquareSizes } from 'common/models/ImageSizes'
import { fetchCoverArt } from 'common/store/cache/collections/actions'

export const useCollectionCoverArt = (
  collectionId: number,
  coverArtSizes: CoverArtSizes | null,
  size: SquareSizes,
  defaultImage: string = imageEmpty as string,
  onDemand = false,
  load = true
) => {
  const dispatch = useDispatch()
  return useImageSize({
    dispatch,
    id: collectionId,
    sizes: coverArtSizes,
    size,
    action: fetchCoverArt,
    defaultImage,
    onDemand,
    load
  })
}
