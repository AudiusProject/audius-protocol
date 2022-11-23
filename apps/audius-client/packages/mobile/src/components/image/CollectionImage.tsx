import type { Collection, Nullable, User } from '@audius/common'
import { cacheUsersSelectors } from '@audius/common'
import { useSelector } from 'react-redux'

import imageEmpty from 'app/assets/images/imageBlank2x.png'
import type { DynamicImageProps } from 'app/components/core'
import { DynamicImage } from 'app/components/core'
import { useContentNodeImage } from 'app/hooks/useContentNodeImage'

const { getUser } = cacheUsersSelectors

export const useCollectionImage = (
  collection: Nullable<
    Pick<Collection, 'cover_art_sizes' | 'cover_art' | 'playlist_owner_id'>
  >,
  user?: Pick<User, 'creator_node_endpoint'>
) => {
  const cid = collection
    ? collection.cover_art_sizes || collection.cover_art
    : null

  const selectedUser = useSelector((state) =>
    getUser(state, { id: collection?.playlist_owner_id })
  )

  return useContentNodeImage({
    cid,
    user: selectedUser ?? user ?? null,
    fallbackImageSource: imageEmpty
  })
}

type CollectionImageProps = {
  collection: Parameters<typeof useCollectionImage>[0]
  user?: Parameters<typeof useCollectionImage>[1]
} & DynamicImageProps

export const CollectionImage = (props: CollectionImageProps) => {
  const { collection, user, ...imageProps } = props
  const { source, handleError } = useCollectionImage(collection, user)

  return <DynamicImage {...imageProps} source={source} onError={handleError} />
}
