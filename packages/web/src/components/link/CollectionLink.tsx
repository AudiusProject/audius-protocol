import { useCollection } from '@audius/common/api'
import { ID } from '@audius/common/models'
import { pick } from 'lodash'

import { TextLink, TextLinkProps } from './TextLink'

type CollectionLinkProps = Omit<TextLinkProps, 'to'> & {
  collectionId: ID
}

export const CollectionLink = ({
  collectionId,
  ...props
}: CollectionLinkProps) => {
  const { data: partialCollection } = useCollection(collectionId, {
    select: (collection) => pick(collection, 'playlist_name', 'permalink')
  })
  const { playlist_name, permalink } = partialCollection ?? {}
  if (!partialCollection) return null

  return (
    <TextLink to={permalink} {...props}>
      {playlist_name}
    </TextLink>
  )
}
