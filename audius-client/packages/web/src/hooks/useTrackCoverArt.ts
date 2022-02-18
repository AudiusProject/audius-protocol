import { useDispatch } from 'react-redux'

import imageEmpty from 'assets/img/imageBlank2x.png'
import { useImageSize } from 'common/hooks/useImageSize'
import { CoverArtSizes, SquareSizes } from 'common/models/ImageSizes'
import { fetchCoverArt } from 'common/store/cache/tracks/actions'

export const useTrackCoverArt = (
  trackId: number | null,
  coverArtSizes: CoverArtSizes | null,
  size: SquareSizes,
  defaultImage: string = imageEmpty as string,
  onDemand = false,
  load = true
) => {
  const dispatch = useDispatch()
  return useImageSize({
    dispatch,
    id: trackId,
    sizes: coverArtSizes,
    size,
    action: fetchCoverArt,
    defaultImage,
    onDemand,
    load
  })
}
