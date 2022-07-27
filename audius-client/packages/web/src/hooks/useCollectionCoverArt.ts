import { CoverArtSizes, SquareSizes } from '@audius/common'
import { useDispatch } from 'react-redux'

import imageEmpty from 'assets/img/imageBlank2x.png'
import { useImageSize } from 'common/hooks/useImageSize'
import { fetchCoverArt } from 'common/store/cache/collections/actions'

export const useCollectionCoverArt = (
  collectionId: number | null | undefined,
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
