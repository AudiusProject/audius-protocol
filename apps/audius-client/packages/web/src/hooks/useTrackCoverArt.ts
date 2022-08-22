import {
  CoverArtSizes,
  SquareSizes,
  useImageSize,
  cacheTracksActions,
  imageBlank as imageEmpty
} from '@audius/common'
import { useDispatch } from 'react-redux'

const { fetchCoverArt } = cacheTracksActions

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
