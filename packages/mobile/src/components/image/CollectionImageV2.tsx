import type { SquareSizes, ID } from '@audius/common/models'
import {
  cacheCollectionsSelectors,
  reachabilitySelectors
} from '@audius/common/store'
import type { Maybe } from '@audius/common/utils'
import { useSelector } from 'react-redux'

import { FastImage, useTheme } from '@audius/harmony-native'
import type { FastImageProps } from '@audius/harmony-native'
import imageEmpty from 'app/assets/images/imageBlank2x.png'
import { useContentNodeImage } from 'app/hooks/useContentNodeImage'
import { getLocalCollectionCoverArtPath } from 'app/services/offline-downloader'
import { getCollectionDownloadStatus } from 'app/store/offline-downloads/selectors'
import { OfflineDownloadStatus } from 'app/store/offline-downloads/slice'

import { primitiveToImageSource } from './primitiveToImageSource'

const { getIsReachable } = reachabilitySelectors
const { getCollection } = cacheCollectionsSelectors

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

  return primitiveToImageSource(collectionImageUri)
}

export const useCollectionImage = (id: ID, size: SquareSizes) => {
  const cid = useSelector((state) => {
    const collection = getCollection(state, { id })
    return collection?.cover_art_sizes ?? collection?.cover_art ?? null
  })

  const cidMap = useSelector(
    (state) => getCollection(state, { id })?.cover_art_cids
  )

  const optimisticCoverArt = useSelector((state) =>
    primitiveToImageSource(
      getCollection(state, { id })?._cover_art_sizes?.OVERRIDE
    )
  )

  const localCollectionImageSource = useLocalCollectionImageUri(id)
  const localSource = optimisticCoverArt ?? localCollectionImageSource

  const contentNodeSource = useContentNodeImage({
    cid,
    size,
    fallbackImageSource: imageEmpty,
    localSource,
    cidMap
  })

  return contentNodeSource
}

type CollectionImageProps = {
  collectionId: ID
  size: SquareSizes
  style?: FastImageProps['style']
}

export const CollectionImageV2 = (props: CollectionImageProps) => {
  const { collectionId, size, style, ...other } = props

  const collectionImageSource = useCollectionImage(collectionId, size)
  const { color, cornerRadius } = useTheme()

  if (!collectionImageSource) return null

  const { source, handleError, isFallbackImage } = collectionImageSource

  return (
    <FastImage
      {...other}
      style={[
        { aspectRatio: 1, borderRadius: cornerRadius.s },
        isFallbackImage && { backgroundColor: color.background.surface2 },
        style
      ]}
      source={source}
      onError={handleError}
    />
  )
}
