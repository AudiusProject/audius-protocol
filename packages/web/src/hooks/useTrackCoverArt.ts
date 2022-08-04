import { CoverArtSizes, SquareSizes } from '@audius/common'
import { useDispatch } from 'react-redux'

import imageEmpty from 'common/assets/img/imageBlank2x.png'
import { useImageSize } from 'common/hooks/useImageSize'
import { fetchCoverArt } from 'common/store/cache/tracks/actions'

export const useTrackCoverArt = (
  trackId: number | null | string | undefined,
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
