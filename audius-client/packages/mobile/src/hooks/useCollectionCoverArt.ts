import imageEmpty from 'audius-client/src/common/assets/image/imageBlank2x.png'
import { useImageSize } from 'audius-client/src/common/hooks/useImageSize'
import {
  CoverArtSizes,
  SquareSizes
} from 'audius-client/src/common/models/ImageSizes'
import { fetchCoverArt } from 'audius-client/src/common/store/cache/collections/actions'
import { useDispatch } from 'react-redux'

import { useDispatchWeb } from './useDispatchWeb'

export const useCollectionCoverArt = (
  collectionId: number,
  coverArtSizes: CoverArtSizes | null,
  size: SquareSizes,
  defaultImage: string = imageEmpty as string,
  onDemand = false,
  load = true
) => {
  const dispatch = useDispatchWeb() as typeof useDispatch

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
