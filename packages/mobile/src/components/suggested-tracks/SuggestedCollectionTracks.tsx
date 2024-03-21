import {
  useGetPlaylistById,
  useGetSuggestedAlbumTracks,
  useGetSuggestedPlaylistTracks,
  useGetCurrentUserId
} from '@audius/common/api'
import type { ID } from '@audius/common/models'
import { Status } from '@audius/common/models'

import { SuggestedTracks } from './components/SuggestedTracks'

type SuggestedCollectionTracksProps = {
  collectionId: ID
}

const SuggestedAlbumTracks = (props: SuggestedCollectionTracksProps) => {
  const { collectionId } = props
  const { suggestedTracks, onRefresh, onAddTrack, isRefreshing } =
    useGetSuggestedAlbumTracks(collectionId)

  return (
    <SuggestedTracks
      collectionId={collectionId}
      suggestedTracks={suggestedTracks}
      onRefresh={onRefresh}
      onAddTrack={onAddTrack}
      isRefreshing={isRefreshing}
    />
  )
}

const SuggestedPlaylistTracks = (props: SuggestedCollectionTracksProps) => {
  const { collectionId } = props
  const { suggestedTracks, onRefresh, onAddTrack, isRefreshing } =
    useGetSuggestedPlaylistTracks(collectionId)

  return (
    <SuggestedTracks
      collectionId={collectionId}
      suggestedTracks={suggestedTracks}
      onRefresh={onRefresh}
      onAddTrack={onAddTrack}
      isRefreshing={isRefreshing}
    />
  )
}

export const SuggestedCollectionTracks = (
  props: SuggestedCollectionTracksProps
) => {
  const { collectionId } = props
  const { data: currentUserId } = useGetCurrentUserId({})
  const { data: collection, status } = useGetPlaylistById({
    playlistId: collectionId,
    currentUserId
  })

  if (status === Status.LOADING || !collection) return null
  return collection.is_album ? (
    <SuggestedAlbumTracks collectionId={collectionId} />
  ) : (
    <SuggestedPlaylistTracks collectionId={collectionId} />
  )
}
