import type { ID } from '@audius/common'
import {
  useGetCurrentUserId,
  useGetPlaylistById,
  useGetSuggestedAlbumTracks,
  useGetSuggestedPlaylistTracks
} from '@audius/common'

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
  const { data: collection } = useGetPlaylistById({
    playlistId: collectionId,
    currentUserId
  })

  return collection.is_album ? (
    <SuggestedAlbumTracks collectionId={collectionId} />
  ) : (
    <SuggestedPlaylistTracks collectionId={collectionId} />
  )
}
