import { ComponentProps } from 'react'

import { ID, SquareSizes } from '@audius/common/models'
import { Artwork } from '@audius/harmony'

import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'

type CollectionImageProps = {
  collectionId: ID
  size: SquareSizes
} & ComponentProps<'img'>

export const CollectionImage = (props: CollectionImageProps) => {
  const { collectionId, size, ...other } = props

  const imageSource = useCollectionCoverArt({
    collectionId,
    size
  })

  return <Artwork src={imageSource} {...other} />
}
