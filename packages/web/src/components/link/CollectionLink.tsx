import { ID } from '@audius/common/models'
import { cacheCollectionsSelectors } from '@audius/common/store'

import { useSelector } from 'utils/reducer'

import { TextLink, TextLinkProps } from './TextLink'

const { getCollection } = cacheCollectionsSelectors

type CollectionLinkProps = Omit<TextLinkProps, 'to'> & {
  collectionId: ID
}

export const CollectionLink = ({
  collectionId,
  ...props
}: CollectionLinkProps) => {
  const collection = useSelector((state) =>
    getCollection(state, { id: collectionId })
  )
  if (!collection) return null

  return (
    <TextLink to={collection.permalink} {...props}>
      {collection.playlist_name}
    </TextLink>
  )
}
