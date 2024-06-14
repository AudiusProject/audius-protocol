import { getCanonicalName } from '../utils/genres'
import { formatDate, formatSecondsAsText } from '../utils/timeUtil'
import { Nullable } from '../utils/typeUtils'

export enum TrackMetadataType {
  DURATION = 'duration',
  GENRE = 'genre',
  MOOD = 'mood',
  RELEASE_DATE = 'releaseDate',
  UPDATED_AT = 'updatedAt',
  ALBUM = 'album'
}

type TrackMetadataProps = {
  duration?: number
  isUnlisted?: boolean
  genre?: string
  releaseDate?: Nullable<string>
  updatedAt?: Nullable<string>
  isScheduledRelease?: boolean
  mood?: Nullable<string>
}

export const useTrackMetadata = ({
  duration,
  isUnlisted,
  genre,
  releaseDate,
  isScheduledRelease,
  mood
}: TrackMetadataProps) => {
  const labels: {
    id: TrackMetadataType
    isHidden?: boolean
    label: string
    value: string
  }[] = [
    {
      id: TrackMetadataType.DURATION,
      label: 'Duration',
      value: formatSecondsAsText(duration ?? 0)
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

  return { labels }
}
