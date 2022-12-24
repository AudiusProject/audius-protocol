/**
 * TODO: with usLocalCollectionImage, useTrackImage becomes an async-like hook where contentNodeSource is null until
 * localSource returns. This ended up degrading background track-player tasks where new tracks would not
 * display their artwork.
 **/
import type { Collection, Nullable, User } from '@audius/common'
import { cacheUsersSelectors } from '@audius/common'
import { useSelector } from 'react-redux'

import imageEmpty from 'app/assets/images/imageBlank2x.png'
import type { DynamicImageProps } from 'app/components/core'
import { DynamicImage } from 'app/components/core'
import { useContentNodeImage } from 'app/hooks/useContentNodeImage'
// import { useLocalCollectionImage } from 'app/hooks/useLocalImage'

const { getUser } = cacheUsersSelectors

export const useCollectionImage = (
  collection: Nullable<
    Pick<
      Collection,
      'cover_art_sizes' | 'cover_art' | 'playlist_owner_id' | 'playlist_id'
    >
  >,
  user?: Pick<User, 'creator_node_endpoint'>
) => {
  const cid = collection
    ? collection.cover_art_sizes || collection.cover_art
    : null

  const selectedUser = useSelector((state) =>
    getUser(state, { id: collection?.playlist_owner_id })
  )

  // const { value: localSource, loading } = useLocalCollectionImage(
  //   collection?.playlist_id.toString()
  // )

  const contentNodeSource = useContentNodeImage({
    cid,
    user: selectedUser ?? user ?? null,
    fallbackImageSource: imageEmpty
    // localSource
  })

  return contentNodeSource
  // return loading ? null : contentNodeSource
}

type CollectionImageProps = {
  collection: Parameters<typeof useCollectionImage>[0]
  user?: Parameters<typeof useCollectionImage>[1]
} & DynamicImageProps

export const CollectionImage = (props: CollectionImageProps) => {
  const { collection, user, ...imageProps } = props
  const collectionImageSource = useCollectionImage(collection, user)

  return collectionImageSource ? (
    <DynamicImage
      {...imageProps}
      source={collectionImageSource.source}
      onError={collectionImageSource.handleError}
    />
  ) : null
}
