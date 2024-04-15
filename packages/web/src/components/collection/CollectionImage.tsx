import { ComponentProps } from 'react'

import { ID, SquareSizes } from '@audius/common/models'
import { cacheCollectionsSelectors } from '@audius/common/store'
import { Artwork } from '@audius/harmony'

import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import { useSelector } from 'utils/reducer'
const { getCollection } = cacheCollectionsSelectors

type CollectionImageProps = {
  collectionId: ID
  size: SquareSizes
} & ComponentProps<'img'>

export const CollectionImage = (props: CollectionImageProps) => {
  const { collectionId, size, ...other } = props

  const coverArtSizes = useSelector(
    (state) =>
      getCollection(state, { id: collectionId })?._cover_art_sizes ?? null
  )

  const imageSource = useCollectionCoverArt(collectionId, coverArtSizes, size)

  return <Artwork src={imageSource} {...other} />
}
