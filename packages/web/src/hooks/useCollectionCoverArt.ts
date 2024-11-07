import { imageBlank as imageEmpty } from '@audius/common/assets'
import { useImageSize, useImageSize2 } from '@audius/common/hooks'
import { SquareSizes, CoverArtSizes, ID } from '@audius/common/models'
import {
  CommonState,
  cacheCollectionsActions,
  cacheCollectionsSelectors
} from '@audius/common/store'
import { Maybe } from '@audius/common/utils'
import { useDispatch, useSelector } from 'react-redux'

const { fetchCoverArt } = cacheCollectionsActions
const { getCollection } = cacheCollectionsSelectors

export const useCollectionCoverArt = (
  collectionId: number | null | undefined,
  coverArtSizes: CoverArtSizes | null,
  size: SquareSizes,
  defaultImage: string = imageEmpty as string
) => {
  const dispatch = useDispatch()
  return useImageSize({
    dispatch,
    id: collectionId,
    sizes: coverArtSizes,
    size,
    action: fetchCoverArt,
    defaultImage
  })
}

export const useCollectionCoverArt2 = (
  collectionId: Maybe<ID>,
  size: SquareSizes
) => {
  const coverArtSizes = useSelector(
    (state: CommonState) =>
      getCollection(state, { id: collectionId })?._cover_art_sizes ?? null
  )

  return useCollectionCoverArt(collectionId, coverArtSizes, size)
}

export const useCollectionCoverArt3 = ({
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
  const image = useImageSize2({
    artwork,
    targetSize: size,
    defaultImage: defaultImage ?? imageEmpty
  })

  // Return edited artwork from this session, if it exists
  // TODO(PAY-3588) Update field once we've switched to another property name
  // for local changes to artwork
  // @ts-ignore
  if (artwork?.url) return artwork.url

  return image
}
