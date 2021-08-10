import { formatGateway, getImageUrl } from '../utils/helpers'

export const getCoverArtCID = (trackOrPlaylist: any) => {
  if (trackOrPlaylist.track_id) {
    return trackOrPlaylist.cover_art_sizes
      ? `${trackOrPlaylist.cover_art_sizes}/1000x1000.jpg`
      : trackOrPlaylist.cover_art
  } else if (trackOrPlaylist.playlist_id) {
    return trackOrPlaylist.playlist_image_sizes_multihash
      ? `${trackOrPlaylist.playlist_image_sizes_multihash}/1000x1000.jpg`
      : trackOrPlaylist.playlist_image_multihash
  }
  return ''
}

export const getCoverArt = (trackOrPlaylist: any, user: any) => {
  const gateway = formatGateway(user.creator_node_endpoint, user.user_id)
  const coverArtCID = getCoverArtCID(trackOrPlaylist)
  return getImageUrl(coverArtCID, gateway)
}

/**
 * Formats a URL name for routing.
 *  - Removes reserved URL characters
 *  - Replaces white space with -
 *  - Lower cases
 */
const formatUrlName = (name: string): string => {
  if (!name) return ''
  return name
    .replace(/!|%|#|\$|&|'|\(|\)|&|\*|\+|,|\/|:|;|=|\?|@|\[|\]/g, '')
    .replace(/\s+/g, '-')
    // Reduce repeated `-` to a single `-`
    .replace(/-+/g, '-')
    .toLowerCase()
}

const encodeUrlName = (name: string): string => {
  return encodeURIComponent(formatUrlName(name))
}

export const getCollectionPath = ({ ownerHandle, isAlbum, name, id }: {
  ownerHandle: string,
  isAlbum: boolean,
  name: string,
  id: number
}) => `${encodeUrlName(ownerHandle)}/${isAlbum ? 'album' : 'playlist'}/${encodeUrlName(name)}-${id}`
