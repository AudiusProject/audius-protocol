import {
  cacheTracksActions,
  imageBlank as imageEmpty,
  cacheTracksSelectors
} from '@audius/common'
import { useImageSize } from '@audius/common/hooks'
import { SquareSizes, ID, CoverArtSizes } from '@audius/common/models'
import { Maybe } from '@audius/common/utils'
import { useDispatch } from 'react-redux'

import { useSelector } from 'utils/reducer'

const { fetchCoverArt } = cacheTracksActions
const { getTrack } = cacheTracksSelectors

export const useTrackCoverArt = (
  trackId: number | null | string | undefined,
  coverArtSizes: CoverArtSizes | null,
  size: SquareSizes,
  defaultImage: string = imageEmpty as string
) => {
  const dispatch = useDispatch()
  return useImageSize({
    dispatch,
    id: trackId,
    sizes: coverArtSizes,
    size,
    action: fetchCoverArt,
    defaultImage
  })
}

export const useTrackCoverArt2 = (trackId: Maybe<ID>, size: SquareSizes) => {
  const coverArtSizes = useSelector(
    (state) => getTrack(state, { id: trackId })?._cover_art_sizes ?? {}
  )

  return useTrackCoverArt(trackId, coverArtSizes, size)
}
