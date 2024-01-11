import {
  ID,
  useGetCurrentUserId,
  useGetPlaylistById,
  useGetSuggestedAlbumTracks,
  useGetSuggestedPlaylistTracks
} from '@audius/common'

import { SuggestedTracks } from './components/SuggestedTracks'
import { props } from '@audius/harmony/dist/assets/animations/Soundwave.json'

type SuggestedTracksProps = {
  collectionId: ID
}

const SuggestedAlbumTracks = (props: SuggestedTracksProps) => {
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

const SuggestedPlaylistTracks = (props: SuggestedTracksProps) => {
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

export const SuggestedCollectionTracks = (props: SuggestedTracksProps) => {
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
