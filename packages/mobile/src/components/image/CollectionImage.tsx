import type { Collection, Nullable, SquareSizes, User } from '@audius/common'
import { cacheUsersSelectors } from '@audius/common'
import { useSelector } from 'react-redux'

import imageEmpty from 'app/assets/images/imageBlank2x.png'
import type { DynamicImageProps } from 'app/components/core'
import { DynamicImage } from 'app/components/core'
import { useContentNodeImage } from 'app/hooks/useContentNodeImage'
import { useLocalCollectionImage } from 'app/hooks/useLocalImage'

const { getUser } = cacheUsersSelectors

type UseCollectionImageOptions = {
  collection: Nullable<
    Pick<
      Collection,
      'playlist_id' | 'cover_art_sizes' | 'cover_art' | 'playlist_owner_id'
    >
  >
  size: SquareSizes
  user?: Pick<User, 'creator_node_endpoint'>
}

export const useCollectionImage = ({
  collection,
  size,
  user
}: UseCollectionImageOptions) => {
  const cid = collection
    ? collection.cover_art_sizes || collection.cover_art
    : null

  const selectedUser = useSelector((state) =>
    getUser(state, { id: collection?.playlist_owner_id })
  )

  const { value: localSource, loading } = useLocalCollectionImage({
    collectionId: collection?.playlist_id.toString(),
    size
  })

  const contentNodeSource = useContentNodeImage({
    cid,
    size,
    user: selectedUser ?? user ?? null,
    fallbackImageSource: imageEmpty,
    localSource
  })

  return loading ? null : contentNodeSource
}

type CollectionImageProps = UseCollectionImageOptions & DynamicImageProps

export const CollectionImage = (props: CollectionImageProps) => {
  const { collection, size, user, ...imageProps } = props
  const collectionImageSource = useCollectionImage({ collection, size, user })

  return collectionImageSource ? (
    <DynamicImage
      {...imageProps}
      source={collectionImageSource.source}
      onError={collectionImageSource.handleError}
    />
  ) : null
}
