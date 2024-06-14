import { useGetTrackById } from '~/api/track'
import { ID } from '~/models'

import { getCanonicalName } from '../utils/genres'
import { formatDate, formatSecondsAsText } from '../utils/timeUtil'

export enum TrackMetadataType {
  DURATION = 'duration',
  GENRE = 'genre',
  MOOD = 'mood',
  RELEASE_DATE = 'releaseDate',
  UPDATED_AT = 'updatedAt',
  ALBUM = 'album'
}

type TrackMetadataProps = {
  trackId: ID
}

type TrackMetadataInfo = {
  id: TrackMetadataType
  label: string
  value: string
  // isHidden?: boolean
}

export const useTrackMetadata = ({
  trackId
}: TrackMetadataProps): TrackMetadataInfo[] => {
  const { data: track } = useGetTrackById({ id: trackId })
  if (!track) return []

  const labels: TrackMetadataInfo[] = [
    {
      id: TrackMetadataType.DURATION,
      label: 'Duration',
      value: formatSecondsAsText(track.duration ?? 0)
    },
    {
      id: TrackMetadataType.GENRE,
      label: 'Genre',
      value: getCanonicalName(track?.genre)
    },
    {
      id: TrackMetadataType.RELEASE_DATE,
      value: formatDate(track.release_date ?? ''),
      label: 'Released',
      isHidden:
        track.is_unlisted || !track.release_date || track.is_scheduled_release
    },
    {
      id: TrackMetadataType.MOOD,
      label: 'Mood',
      value: track.mood
    }
  ].filter(({ isHidden, value }) => !isHidden && !!value)

  return labels
}
