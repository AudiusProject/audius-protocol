import type { User, Track, Nullable, SquareSizes } from '@audius/common'
import { cacheUsersSelectors } from '@audius/common'
import { useSelector } from 'react-redux'

import imageEmpty from 'app/assets/images/imageBlank2x.png'
import type { DynamicImageProps } from 'app/components/core'
import { DynamicImage } from 'app/components/core'
import { useContentNodeImage } from 'app/hooks/useContentNodeImage'
import { useLocalTrackImage } from 'app/hooks/useLocalImage'

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
  const { value: localSource, loading } = useLocalTrackImage({
    trackId: track?.track_id.toString(),
    size
  })

  const contentNodeSource = useContentNodeImage({
    cid,
    size,
    user: user ?? selectedUser,
    fallbackImageSource: imageEmpty,
    localSource
  })

  return loading ? null : contentNodeSource
}

type TrackImageProps = UseTrackImageOptions & DynamicImageProps

export const TrackImage = (props: TrackImageProps) => {
  const { track, size, user, ...imageProps } = props

  const trackImageSource = useTrackImage({ track, size, user })

  return trackImageSource ? (
    <DynamicImage
      {...imageProps}
      source={trackImageSource.source}
      onError={trackImageSource.handleError}
    />
  ) : null
}
