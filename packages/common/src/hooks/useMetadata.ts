import { getCanonicalName } from '../utils/genres'
import { formatDate, formatSecondsAsText } from '../utils/timeUtil'
import { Nullable } from '../utils/typeUtils'

type CollectionMetadataProps = {
  duration?: number
  isPrivate?: boolean
  numTracks?: number
  releaseDate?: Nullable<string>
  updatedAt?: Nullable<string>
  isScheduledRelease?: boolean
}

export const useCollectionMetadata = ({
  duration,
  isPrivate,
  numTracks,
  updatedAt,
  releaseDate,
  isScheduledRelease
}: CollectionMetadataProps) => {
  const labels: { isHidden?: boolean; label: string; value: any }[] = [
    {
      label: 'Duration',
      value: `${numTracks} tracks${
        duration ? `, ${formatSecondsAsText(duration)}` : ''
      }`,
      isHidden: !numTracks
    },
    {
      value: formatDate(releaseDate ?? ''),
      label: 'Released',
      isHidden: isPrivate || !releaseDate || isScheduledRelease
    },
    {
      value: formatDate(updatedAt ?? ''),
      label: 'Updated',
      isHidden: isPrivate || !updatedAt
    }
  ].filter(({ isHidden, value }) => !isHidden && !!value)

  return { labels }
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
  const labels: { isHidden?: boolean; label: string; value: any }[] = [
    {
      label: 'Duration',
      value: formatSecondsAsText(duration ?? 0)
    },
    {
      label: 'Genre',
      value: getCanonicalName(genre)
    },
    {
      value: formatDate(releaseDate ?? ''),
      label: 'Released',
      isHidden: isUnlisted || !releaseDate || isScheduledRelease
    },
    {
      label: 'Mood',
      value: mood
    }
  ].filter(({ isHidden, value }) => !isHidden && !!value)

  return { labels }
}
