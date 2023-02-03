import type { User, Track, Nullable, SquareSizes } from '@audius/common'
import { cacheUsersSelectors } from '@audius/common'
import { useSelector } from 'react-redux'

import imageEmpty from 'app/assets/images/imageBlank2x.png'
import { useContentNodeImage } from 'app/hooks/useContentNodeImage'
import { useLocalTrackImage } from 'app/hooks/useLocalImage'
import { useThemeColors } from 'app/utils/theme'

import type { FastImageProps } from './FastImage'
import { FastImage } from './FastImage'

export const DEFAULT_IMAGE_URL =
  'https://download.audius.co/static-resources/preview-image.jpg'

const { getUser } = cacheUsersSelectors

type UseTrackImageOptions = {
  track: Nullable<
    Pick<Track, 'track_id' | 'cover_art_sizes' | 'cover_art' | 'owner_id'>
  >
  size: SquareSizes
  user?: Pick<User, 'creator_node_endpoint'>
}

export const useTrackImage = ({ track, size, user }: UseTrackImageOptions) => {
  const cid = track ? track.cover_art_sizes || track.cover_art : null

  const selectedUser = useSelector((state) =>
    getUser(state, { id: track?.owner_id })
  )
  const { value: localSource, loading } = useLocalTrackImage(
    track?.track_id.toString()
  )

  const contentNodeSource = useContentNodeImage({
    cid,
    size,
    user: user ?? selectedUser,
    fallbackImageSource: imageEmpty,
    localSource
  })

  return loading ? null : contentNodeSource
}

type TrackImageProps = UseTrackImageOptions & Partial<FastImageProps>

export const TrackImage = (props: TrackImageProps) => {
  const { track, size, user, style, ...other } = props

  const trackImageSource = useTrackImage({ track, size, user })
  const { neutralLight8 } = useThemeColors()

  if (!trackImageSource) return null

  const { source, handleError, isFallbackImage } = trackImageSource

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
