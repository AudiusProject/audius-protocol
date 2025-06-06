import { pick } from 'lodash'

import { useCollection, useCollectionTracks } from '~/api'
import { ID } from '~/models/Identifiers'
import { pluralize } from '~/utils/formatUtil'
import { formatDate, formatSecondsAsText } from '~/utils/timeUtil'

export enum CollectionMetadataType {
  DURATION = 'duration',
  RELEASE_DATE = 'releaseDate',
  UPDATED_AT = 'updatedAt'
}

export type AlbumInfo = {
  playlist_name: string
  permalink: string
}

type CollectionMetadataInfo = {
  id: CollectionMetadataType
  label: string
  value: string
}

type CollectionMetadataProps = {
  collectionId: ID
}

export const useCollectionMetadata = ({
  collectionId
}: CollectionMetadataProps): CollectionMetadataInfo[] => {
  const { data: collectionMetadata } = useCollection(collectionId, {
    select: (playlist) =>
      pick(playlist, [
        'is_private',
        'updated_at',
        'release_date',
        'created_at',
        'playlist_contents'
      ])
  })

  const { data: tracks } = useCollectionTracks(collectionId)
  const duration = tracks?.reduce((acc, track) => acc + track.duration, 0) ?? 0

  if (!collectionMetadata) return []

  const {
    is_private: isPrivate,
    updated_at: updatedAt,
    release_date: releaseDate,
    created_at: createdAt,
    playlist_contents: playlistContents
  } = collectionMetadata
  const numTracks = playlistContents?.track_ids?.length ?? 0

  const metadataItems = [
    {
      id: CollectionMetadataType.RELEASE_DATE,
      value: formatDate(releaseDate ?? createdAt),
      label: 'Released',
      isHidden: isPrivate
    },
    {
      id: CollectionMetadataType.UPDATED_AT,
      value: formatDate(updatedAt ?? createdAt),
      label: 'Updated',
      isHidden: isPrivate
    },
    {
      id: CollectionMetadataType.DURATION,
      label: 'Duration',
      value: `${numTracks} ${pluralize('track', numTracks)}${
        duration ? `, ${formatSecondsAsText(duration)}` : ''
      }`,
      isHidden: !numTracks
    }
  ].filter(({ isHidden, value }) => !isHidden && !!value)

  return metadataItems
}
