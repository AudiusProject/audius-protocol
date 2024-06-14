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
}

export const useTrackMetadata = ({
  trackId
}: TrackMetadataProps): TrackMetadataInfo[] => {
  const { data: track } = useGetTrackById({ id: trackId })
  if (!track) return []

  const {
    duration,
    genre,
    release_date: releaseDate,
    is_scheduled_release: isScheduledRelease,
    mood,
    is_unlisted: isUnlisted
  } = track

  const labels: TrackMetadataInfo[] = [
    {
      id: TrackMetadataType.DURATION,
      label: 'Duration',
      value: formatSecondsAsText(duration)
    },
    {
      id: TrackMetadataType.GENRE,
      label: 'Genre',
      value: getCanonicalName(genre)
    },
    {
      id: TrackMetadataType.RELEASE_DATE,
      value: formatDate(releaseDate ?? ''),
      label: 'Released',
      isHidden: isUnlisted || !releaseDate || isScheduledRelease
    },
    {
      id: TrackMetadataType.MOOD,
      label: 'Mood',
      value: mood
    }
  ].filter(({ isHidden, value }) => !isHidden && !!value)

  return labels
}
