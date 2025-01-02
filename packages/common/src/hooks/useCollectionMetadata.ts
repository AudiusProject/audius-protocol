import { useSelector } from 'react-redux'

import { useCurrentUserId } from '~/api'
import { useGetPlaylistById } from '~/api/collection'
import { ID } from '~/models/Identifiers'
import { getCollectionDuration } from '~/store/cache/collections/selectors'
import { CommonState } from '~/store/commonStore'
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
  const { data: currentUserId } = useCurrentUserId()
  const { data: collection } = useGetPlaylistById({
    playlistId: collectionId,
    currentUserId
  })
  const duration = useSelector((state: CommonState) =>
    getCollectionDuration(state, { id: collectionId })
  )

  if (!collection) return []

  const {
    is_private: isPrivate,
    updated_at: updatedAt,
    release_date: releaseDate,
    created_at: createdAt
  } = collection
  const numTracks = collection.playlist_contents?.track_ids?.length ?? 0

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
