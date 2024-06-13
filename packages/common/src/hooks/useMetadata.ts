import { getCanonicalName } from '../utils/genres'
import { formatDate, formatSecondsAsText } from '../utils/timeUtil'
import { Nullable } from '../utils/typeUtils'

export enum MetadataType {
  DURATION = 'duration',
  GENRE = 'genre',
  MOOD = 'mood',
  RELEASE_DATE = 'releaseDate',
  UPDATED_AT = 'updatedAt',
  ALBUM = 'album'
}

export type AlbumInfo = {
  playlist_name: string
  permalink: string
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
    id: MetadataType
    isHidden?: boolean
    label: string
    value: string
  }[] = [
    {
      id: MetadataType.DURATION,
      label: 'Duration',
      value: formatSecondsAsText(duration ?? 0)
    },
    {
      id: MetadataType.GENRE,
      label: 'Genre',
      value: getCanonicalName(genre)
    },
    {
      id: MetadataType.RELEASE_DATE,
      value: formatDate(releaseDate ?? ''),
      label: 'Released',
      isHidden: isUnlisted || !releaseDate || isScheduledRelease
    },
    {
      id: MetadataType.MOOD,
      label: 'Mood',
      value: mood
    }
  ].filter(({ isHidden, value }) => !isHidden && !!value)

  return { labels }
}

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
      id: MetadataType.DURATION,
      label: 'Duration',
      value: `${numTracks} tracks${
        duration ? `, ${formatSecondsAsText(duration)}` : ''
      }`,
      isHidden: !numTracks
    },
    {
      id: MetadataType.RELEASE_DATE,
      value: formatDate(releaseDate ?? ''),
      label: 'Released',
      isHidden: isPrivate || !releaseDate || isScheduledRelease
    },
    {
      id: MetadataType.UPDATED_AT,
      value: formatDate(updatedAt ?? ''),
      label: 'Updated',
      isHidden: isPrivate || !updatedAt
    }
  ].filter(({ isHidden, value }) => !isHidden && !!value)

  return { labels }
}
