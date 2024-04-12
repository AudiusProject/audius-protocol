import { ID, SquareSizes } from '@audius/common/models'
import { cacheCollectionsSelectors } from '@audius/common/store'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import { useCollectionCoverArt } from 'hooks/useCollectionCoverArt'
import { useSelector } from 'utils/reducer'
const { getCollection } = cacheCollectionsSelectors

type CollectionImageProps = {
  className?: string
  id: ID
  size: SquareSizes
  'data-testid'?: string
}

export const CollectionImage = (props: CollectionImageProps) => {
  const { id, size, className, ...other } = props

  const coverArtSizes = useSelector(
    (state) => getCollection(state, { id })?._cover_art_sizes ?? null
  )

  const image = useCollectionCoverArt(id, coverArtSizes, size)

  return <DynamicImage image={image} wrapperClassName={className} {...other} />
}
