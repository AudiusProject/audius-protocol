import type { SquareSizes, ID } from '@audius/common/models'
import {
  cacheTracksSelectors,
  reachabilitySelectors
} from '@audius/common/store'
import type { Maybe } from '@audius/common/utils'
import { useSelector } from 'react-redux'

import type { FastImageProps } from '@audius/harmony-native'
import { FastImage, useTheme } from '@audius/harmony-native'
import imageEmpty from 'app/assets/images/imageBlank2x.png'
import { useContentNodeImage } from 'app/hooks/useContentNodeImage'
import { getLocalTrackCoverArtPath } from 'app/services/offline-downloader'
import { getTrackDownloadStatus } from 'app/store/offline-downloads/selectors'
import { OfflineDownloadStatus } from 'app/store/offline-downloads/slice'

import { primitiveToImageSource } from './primitiveToImageSource'

export const DEFAULT_IMAGE_URL =
  'https://download.audius.co/static-resources/preview-image.jpg'

const { getTrack } = cacheTracksSelectors
const { getIsReachable } = reachabilitySelectors

const useLocalTrackImageUri = (trackId: Maybe<ID>) => {
  const trackImageUri = useSelector((state) => {
    if (!trackId) return null

    const isReachable = getIsReachable(state)
    if (isReachable) return null

    const trackDownloadStatus = getTrackDownloadStatus(state, trackId)
    const isDownloaded = trackDownloadStatus === OfflineDownloadStatus.SUCCESS
    if (!isDownloaded) return null

    return `file://${getLocalTrackCoverArtPath(trackId.toString())}`
  })

  return primitiveToImageSource(trackImageUri)
}

export const useTrackImage = (id: ID, size: SquareSizes) => {
  const cid = useSelector((state) => {
    const track = getTrack(state, { id })
    return track?.cover_art_sizes ?? track?.cover_art ?? null
  })

  const cidMap = useSelector((state) => getTrack(state, { id })?.cover_art_cids)

  const optimisticCoverArt = useSelector((state) =>
    primitiveToImageSource(getTrack(state, { id })?._cover_art_sizes?.OVERRIDE)
  )

  const localTrackImageSource = useLocalTrackImageUri(id)
  const localSource = optimisticCoverArt ?? localTrackImageSource

  const contentNodeSource = useContentNodeImage({
    cid,
    size,
    fallbackImageSource: imageEmpty,
    localSource,
    cidMap
  })

  return contentNodeSource
}

type TrackImageProps = {
  trackId: ID
  size: SquareSizes
  style?: FastImageProps['style']
}

export const TrackImageV2 = (props: TrackImageProps) => {
  const { trackId, size, style, ...other } = props

  const trackImageSource = useTrackImage(trackId, size)
  const { color, cornerRadius } = useTheme()

  if (!trackImageSource) return null

  const { source, handleError, isFallbackImage } = trackImageSource

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
