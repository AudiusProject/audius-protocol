import { formatDate, formatSecondsAsText } from '../utils/timeUtil'
import { Nullable } from '../utils/typeUtils'

export enum CollectionMetadataType {
  DURATION = 'duration',
  RELEASE_DATE = 'releaseDate',
  UPDATED_AT = 'updatedAt'
}

export type AlbumInfo = {
  playlist_name: string
  permalink: string
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
  const labels: {
    id: CollectionMetadataType
    isHidden?: boolean
    label: string
    value: any
  }[] = [
    {
      id: CollectionMetadataType.DURATION,
      label: 'Duration',
      value: `${numTracks} tracks${
        duration ? `, ${formatSecondsAsText(duration)}` : ''
      }`,
      isHidden: !numTracks
    },
    {
      id: CollectionMetadataType.RELEASE_DATE,
      value: formatDate(releaseDate ?? ''),
      label: 'Released',
      isHidden: isPrivate || !releaseDate || isScheduledRelease
    },
    {
      id: CollectionMetadataType.UPDATED_AT,
      value: formatDate(updatedAt ?? ''),
      label: 'Updated',
      isHidden: isPrivate || !updatedAt
    }
  ].filter(({ isHidden, value }) => !isHidden && !!value)

  return { labels }
}
