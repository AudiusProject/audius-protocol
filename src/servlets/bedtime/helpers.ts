import { formatGateway, getImageUrl } from '../utils/helpers'

export const getCoverArtCID = (trackOrPlaylist: any) => (
  trackOrPlaylist.cover_art_sizes
    ? `${trackOrPlaylist.cover_art_sizes}/480x480.jpg`
    : trackOrPlaylist.cover_art
)

export const getCoverArt = (trackOrPlaylist: any, user: any) => {
  const gateway = formatGateway(user.creator_node_endpoint, user.user_id)
  const coverArtCID = getCoverArtCID(getCoverArtCID)
  return getImageUrl(coverArtCID, gateway)
}

export const getTrackPath = ({ routeId, trackId }: { routeId: string, trackId: number }) => (encodeURI(`${routeId}-${trackId}`))

export const getCollectionPath = ({ ownerHandle, isAlbum, name, id }: {
  ownerHandle: string,
  isAlbum: boolean,
  name: string,
  id: number
}) => (encodeURI(`${ownerHandle}/${isAlbum ? 'album' : 'playlist'}/${name}-${id}`))