export const DEFAULT_IMAGE_URL = 'https://download.audius.co/static-resources/preview-image.jpg'
export const HEAVY_ROTATION_URL = 'https://download.audius.co/static-resources/heavy-rotation.png'
export const LET_THEM_DJ_URL = 'https://download.audius.co/static-resources/let-them-dj.png'
export const BEST_NEW_RELEASES_URL = 'https://download.audius.co/static-resources/best-new-releases.png'
export const UNDER_THE_RADAR_URL = 'https://download.audius.co/static-resources/under-the-radar.png'
export const TOP_ALBUMS_URL = 'https://download.audius.co/static-resources/top-albums.png'
export const TOP_PLAYLISTS_URL = 'https://download.audius.co/static-resources/top-playlists.png'
export const MOST_LOVED_URL = 'https://download.audius.co/static-resources/most-loved.png'
export const FEELING_LUCKY_URL = 'https://download.audius.co/static-resources/feeling-lucky.png'
export const USER_NODE_IPFS_GATEWAY = 'https://usermetadata.audius.co/ipfs/'

export interface ExploreInfoType {
  title: string,
  description: string,
  image: string
}

export const exploreMap: { [key: string]: ExploreInfoType } = {
  'heavy-rotation': {
    title: 'Heavy Rotation',
    description: 'Your top tracks, in one place',
    image: HEAVY_ROTATION_URL
  },
  'let-them-dj': {
    title: 'Let Them DJ',
    description: 'Playlists created by the people you follow',
    image: LET_THEM_DJ_URL
  },
  'best-new-releases': {
    title: 'Best New Releases',
    description: 'From the artists you follow',
    image: BEST_NEW_RELEASES_URL
  },
  'under-the-radar': {
    title: 'Under The Radar',
    description: 'Tracks you might have missed from the artists you follow',
    image: UNDER_THE_RADAR_URL
  },
  'top-albums': {
    title: 'Top Albums',
    description: 'The top albums from all of Audius',
    image: TOP_ALBUMS_URL
  },
  'top-playlists': {
    title: 'Top Playlists',
    description: 'The top playlists on Audius right now',
    image: TOP_PLAYLISTS_URL
  },
  'trending-playlists': {
    title: 'Trending Playlists',
    description: 'The trending playlists on Audius right now',
    image: TOP_PLAYLISTS_URL
  },
  'most-loved': {
    title: 'Most Loved',
    description: 'Tracks favorited by the people you follow',
    image: MOST_LOVED_URL
  },
  'feeling-lucky': {
    title: 'Feeling Lucky',
    description: 'A purely random collection of tracks from Audius',
    image: FEELING_LUCKY_URL
  },
}
