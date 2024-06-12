import { getCanonicalName } from '../utils/genres'
import { formatDate, formatSecondsAsText } from '../utils/timeUtil'
import { Nullable } from '../utils/typeUtils'

type SecondaryStatsProps = {
  duration?: number
  isUnlisted?: boolean
  numTracks?: number
  genre?: string
  releaseDate?: Nullable<string>
  updatedAt?: Nullable<string>
  isScheduledRelease?: boolean
  mood?: Nullable<string>
}

export const useCollectionSecondaryStats = ({
  duration,
  isUnlisted,
  numTracks,
  updatedAt,
  releaseDate,
  isScheduledRelease
}: SecondaryStatsProps) => {
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
      isHidden: isUnlisted || !releaseDate || isScheduledRelease
    },
    {
      value: formatDate(updatedAt ?? ''),
      label: 'Updated',
      isHidden: isUnlisted || !updatedAt
    }
  ].filter(({ isHidden, value }) => !isHidden && !!value)

  return { labels }
}

export const useTrackSecondaryStats = ({
  duration,
  isUnlisted,
  genre,
  releaseDate,
  isScheduledRelease,
  mood
}: SecondaryStatsProps) => {
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
