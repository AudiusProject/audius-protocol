import { useGetTrackById } from '@audius/common/api'
import { useTrackSecondaryStats } from '@audius/common/hooks'
import type { ID } from '@audius/common/models'
import { trpc } from '@audius/web/src/utils/trpcClientWeb'

import { Flex, TextLink } from '@audius/harmony-native'

import { SecondaryStatRow } from './SecondaryStatRow'

const messages = {
  album: 'Album'
}

type SecondaryStatsProps = {
  trackId?: ID
}

/**
 * The additional metadata shown at the bottom of the Track Screen and Collection Screen Headers
 */
export const TrackSecondaryStats = ({ trackId }: SecondaryStatsProps) => {
  const { data: track } = useGetTrackById(
    { id: trackId! },
    { disabled: !trackId }
  )
  const { data: albumInfo } = trpc.tracks.getAlbumBacklink.useQuery(
    { trackId: trackId! },
    { enabled: !!trackId }
  )

  const { labels } = useTrackSecondaryStats({
    duration: track?.duration,
    releaseDate: track?.release_date,
    mood: track?.mood,
    genre: track?.genre,
    isUnlisted: track?.is_unlisted
  })

  return (
    <Flex gap='l' w='100%' direction='row' wrap='wrap'>
      {labels.map((label, i) => (
        <SecondaryStatRow key={i} label={label.label}>
          {label.value}
        </SecondaryStatRow>
      ))}
      {albumInfo ? (
        <SecondaryStatRow label={messages.album}>
          <TextLink to={albumInfo?.permalink}>
            {albumInfo?.playlist_name}
          </TextLink>
        </SecondaryStatRow>
      ) : null}
    </Flex>
  )
}
