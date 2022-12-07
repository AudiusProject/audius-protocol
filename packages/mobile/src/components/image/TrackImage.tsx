import type { User, Track, Nullable } from '@audius/common'
import { cacheUsersSelectors } from '@audius/common'
import { useSelector } from 'react-redux'

import imageEmpty from 'app/assets/images/imageBlank2x.png'
import type { DynamicImageProps } from 'app/components/core'
import { DynamicImage } from 'app/components/core'
import { useContentNodeImage } from 'app/hooks/useContentNodeImage'
import { useLocalTrackImage } from 'app/hooks/useLocalImage'

const { getUser } = cacheUsersSelectors

export const DEFAULT_IMAGE_URL =
  'https://download.audius.co/static-resources/preview-image.jpg'

export const useTrackImage = (
  track: Nullable<
    Pick<Track, 'track_id' | 'cover_art_sizes' | 'cover_art' | 'owner_id'>
  >,
  user?: Pick<User, 'creator_node_endpoint'>
) => {
  const cid = track ? track.cover_art_sizes || track.cover_art : null

  const selectedUser = useSelector((state) =>
    getUser(state, { id: track?.owner_id })
  )
  const { value: localSource, loading } = useLocalTrackImage(
    track?.track_id.toString()
  )

  const contentNodeSource = useContentNodeImage({
    cid,
    user: user ?? selectedUser,
    fallbackImageSource: imageEmpty,
    localSource
  })

  return loading ? null : contentNodeSource
}

type TrackImageProps = {
  track: Parameters<typeof useTrackImage>[0]
  user?: Parameters<typeof useTrackImage>[1]
} & DynamicImageProps

export const TrackImage = (props: TrackImageProps) => {
  const { track, user, ...imageProps } = props

  const trackImageSource = useTrackImage(track, user)

  return trackImageSource ? (
    <DynamicImage
      {...imageProps}
      source={trackImageSource.source}
      onError={trackImageSource.handleError}
    />
  ) : null
}
