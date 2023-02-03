import type { Collection, Nullable, SquareSizes, User } from '@audius/common'
import { cacheUsersSelectors } from '@audius/common'
import { useSelector } from 'react-redux'

import imageEmpty from 'app/assets/images/imageBlank2x.png'
import { useContentNodeImage } from 'app/hooks/useContentNodeImage'
import { useLocalCollectionImage } from 'app/hooks/useLocalImage'
import { useThemeColors } from 'app/utils/theme'

import type { FastImageProps } from './FastImage'
import { FastImage } from './FastImage'

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

export const useCollectionImage = (options: UseCollectionImageOptions) => {
  const { collection, size, user } = options
  const cid = collection
    ? collection.cover_art_sizes || collection.cover_art
    : null

  const selectedUser = useSelector((state) =>
    getUser(state, { id: collection?.playlist_owner_id })
  )

  const { value: localSource, loading } = useLocalCollectionImage(
    collection?.playlist_id.toString()
  )

  const contentNodeSource = useContentNodeImage({
    cid,
    size,
    user: selectedUser ?? user ?? null,
    fallbackImageSource: imageEmpty,
    localSource
  })

  return loading ? null : contentNodeSource
}

type CollectionImageProps = UseCollectionImageOptions & Partial<FastImageProps>

export const CollectionImage = (props: CollectionImageProps) => {
  const { collection, size, user, style, ...other } = props

  const collectionImageSource = useCollectionImage({ collection, size, user })
  const { neutralLight8 } = useThemeColors()

  if (!collectionImageSource) return null

  const { source, handleError, isFallbackImage } = collectionImageSource

  if (isFallbackImage) {
    return (
      <FastImage
        {...other}
        style={[style, { backgroundColor: neutralLight8 }]}
        source={source}
        onError={handleError}
      />
    )
  }

  return (
    <FastImage {...other} style={style} source={source} onError={handleError} />
  )
}
