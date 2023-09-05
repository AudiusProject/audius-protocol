import type { SquareSizes } from '@audius/common'
import { cacheTracksActions } from '@audius/common'

import imageEmpty from 'app/assets/images/imageBlank2x.png'
import { getUseImageSizeHook } from 'app/hooks/useImageSize'
const { fetchCoverArt } = cacheTracksActions

export const useTrackCoverArt = getUseImageSizeHook<SquareSizes>({
  action: fetchCoverArt,
  defaultImageSource: imageEmpty
})
