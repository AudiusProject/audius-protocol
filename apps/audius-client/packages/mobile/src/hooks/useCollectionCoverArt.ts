import type { SquareSizes } from '@audius/common'
import { fetchCoverArt } from 'audius-client/src/common/store/cache/collections/actions'

import imageEmpty from 'app/assets/images/imageBlank2x.png'
import { getUseImageSizeHook } from 'app/hooks/useImageSize'

export const useCollectionCoverArt = getUseImageSizeHook<SquareSizes>({
  action: fetchCoverArt,
  defaultImageSource: imageEmpty
})
