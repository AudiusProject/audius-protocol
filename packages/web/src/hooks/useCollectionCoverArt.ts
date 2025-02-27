import { imageBlank as imageEmpty } from '@audius/common/assets'
import { useImageSize } from '@audius/common/hooks'
import { SquareSizes, ID } from '@audius/common/models'
import { CommonState, cacheCollectionsSelectors } from '@audius/common/store'
import { Maybe } from '@audius/common/utils'
import { useSelector } from 'react-redux'

import { preload } from 'utils/image'

const { getCollection } = cacheCollectionsSelectors

export const useCollectionCoverArt = ({
  collectionId,
  size,
  defaultImage
}: {
  collectionId: Maybe<ID>
  size: SquareSizes
  defaultImage?: string
}) => {
  const artwork = useSelector(
    (state: CommonState) => getCollection(state, { id: collectionId })?.artwork
  )
  const image = useImageSize({
    artwork,
    targetSize: size,
    defaultImage: defaultImage ?? imageEmpty,
    preloadImageFn: preload
  })

  // Return edited artwork from this session, if it exists
  // TODO(PAY-3588) Update field once we've switched to another property name
  // for local changes to artwork
  // @ts-ignore
  if (artwork?.url) return artwork.url

  return image
}
