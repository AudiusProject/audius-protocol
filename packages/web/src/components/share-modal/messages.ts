import { ShareType } from '@audius/common/store'
import {} from '@audius/common'

const shareTypeMap: Record<ShareType, string> = {
  track: 'Track',
  profile: 'Profile',
  album: 'Album',
  playlist: 'Playlist',
  audioNftPlaylist: 'Audio NFT Playlist'
}

export const messages = {
  modalTitle: (asset: ShareType) => `Share ${shareTypeMap[asset]}`,
  directMessage: 'Direct Message',
  twitter: 'Twitter',
  tikTok: 'TikTok',
  copyLink: 'Copy Link',
  embed: 'Embed',
  toast: (asset: ShareType) => `Copied Link to ${shareTypeMap[asset]}`,
  trackShareText: (title: string, handle: string) =>
    `Check out ${title} by ${handle} on @audius #Audius`,
  profileShareText: (handle: string) =>
    `Check out ${handle} on @audius #Audius`,
  albumShareText: (albumName: string, handle: string) =>
    `Check out ${albumName} by ${handle} @audius #Audius`,
  playlistShareText: (playlistName: string, handle: string) =>
    `Check out ${playlistName} by ${handle} @audius #Audius`,
  // TODO: See if you can display my when the account user is the user
  audioNftPlaylistShareText: (name: string) =>
    `Check out ${name} Audio NFTs in a playlist @audius #Audius`,
  shareDescription: 'Spread the word! Share with your friends and fans!',
  hiddenPlaylistShareDescription:
    'Spread the word! Share your playlist with friends and fans! Hidden playlists will be visible to anyone on the internet with the link.'
}
