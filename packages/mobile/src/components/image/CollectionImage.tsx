import type {
  Collection,
  ID,
  Maybe,
  Nullable,
  SquareSizes,
  User
} from '@audius/common'
import { reachabilitySelectors, cacheUsersSelectors } from '@audius/common'
import { useSelector } from 'react-redux'

import imageEmpty from 'app/assets/images/imageBlank2x.png'
import { useContentNodeImage } from 'app/hooks/useContentNodeImage'
import { getLocalCollectionCoverArtPath } from 'app/services/offline-downloader'
import { getCollectionDownloadStatus } from 'app/store/offline-downloads/selectors'
import { OfflineDownloadStatus } from 'app/store/offline-downloads/slice'
import { useThemeColors } from 'app/utils/theme'

import type { FastImageProps } from './FastImage'
import { FastImage } from './FastImage'

const { getIsReachable } = reachabilitySelectors
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

const useLocalCollectionImageUri = (collectionId: Maybe<ID>) => {
  const collectionImageUri = useSelector((state) => {
    if (!collectionId) return null

    const isReachable = getIsReachable(state)
    if (isReachable) return null

    const collectionDownloadStatus = getCollectionDownloadStatus(
      state,
      collectionId
    )
    const isDownloaded =
      collectionDownloadStatus === OfflineDownloadStatus.SUCCESS

    if (!isDownloaded) return null

    return `file://${getLocalCollectionCoverArtPath(collectionId.toString())}`
  })

  return collectionImageUri
}

export const useCollectionImage = (options: UseCollectionImageOptions) => {
  const { collection, size, user } = options
  const cid = collection
    ? collection.cover_art_sizes || collection.cover_art
    : null

  const selectedUser = useSelector((state) =>
    getUser(state, { id: collection?.playlist_owner_id })
  )

  const localCollectionImageUri = useLocalCollectionImageUri(
    collection?.playlist_id
  )

  const contentNodeSource = useContentNodeImage({
    cid,
    size,
    user: selectedUser ?? user ?? null,
    fallbackImageSource: imageEmpty,
    localSource: localCollectionImageUri
      ? { uri: localCollectionImageUri }
      : null
  })

  return contentNodeSource
}

type CollectionImageProps = UseCollectionImageOptions & Partial<FastImageProps>

export const CollectionImage = (props: CollectionImageProps) => {
  const { collection, size, user, style, ...other } = props

  const collectionImageSource = useCollectionImage({ collection, size, user })
  const { neutralLight6 } = useThemeColors()

  if (!collectionImageSource) return null

  const { source, handleError, isFallbackImage } = collectionImageSource

  if (isFallbackImage) {
    return (
      <FastImage
        {...other}
        style={[style, { backgroundColor: neutralLight6 }]}
        source={source}
        onError={handleError}
      />
    )
  }

  return (
    <FastImage {...other} style={style} source={source} onError={handleError} />
  )
}
