import type { SquareSizes } from '@audius/common'
import { cacheCollectionsActions } from '@audius/common'

import imageEmpty from 'app/assets/images/imageBlank2x.png'
import { getUseImageSizeHook } from 'app/hooks/useImageSize'
const { fetchCoverArt } = cacheCollectionsActions

export const useCollectionCoverArt = getUseImageSizeHook<SquareSizes>({
  action: fetchCoverArt,
  defaultImageSource: imageEmpty
})
