import { imageBlank as imageEmpty } from '@audius/common/assets'
import { useImageSize2 } from '@audius/common/hooks'
import { SquareSizes, ID } from '@audius/common/models'
import { cacheTracksSelectors } from '@audius/common/store'
import { Maybe } from '@audius/common/utils'

import { useSelector } from 'utils/reducer'

const { getTrack } = cacheTracksSelectors

export const useTrackCoverArt = ({
  trackId,
  size,
  defaultImage
}: {
  trackId: Maybe<ID>
  size: SquareSizes
  defaultImage?: string
}) => {
  const artwork = useSelector(
    (state) => getTrack(state, { id: trackId })?.artwork
  )

  return useImageSize2({
    artwork,
    targetSize: size,
    defaultImage: defaultImage ?? imageEmpty
  })
}
