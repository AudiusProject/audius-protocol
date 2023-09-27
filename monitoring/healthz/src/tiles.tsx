import { buildImageUrls } from './AudiusSurvivalKit'

export function TrackTile({ track }: { track: any }) {
  const img = buildImageUrls(track.user, track.cover_art_sizes, '150x150')
  return (
    <a href={'https://audius.co' + track.permalink} target="_blank" className="m-1 md:m-3 w-24 h-24 md:w-20 md:h-20 flex-shrink-0">
      <img
        src={img}
        alt="Track Cover Art"
        className="w-24 h-24 md:w-20 md:h-20 border-2 border-gold rounded"
      />
    </a>
  )
}

export function PlaylistTile({ playlist }: { playlist: any }) {
  const img = buildImageUrls(playlist.user, playlist.cover_art_sizes, '150x150')
  return (
    <a href={'https://audius.co/#todo_playlist_url'} target="_blank" className="m-1 md:m-3 w-24 h-24 md:w-20 md:h-20 flex-shrink-0">
      <img
        src={img}
        alt="Playlist Cover Art"
        className="w-24 h-24 md:w-20 md:h-20 border-2 border-purple rounded"
      />
    </a>
  )
}

export function UserTile({ user }: { user: any }) {
  const img = buildImageUrls(user, user.profile_picture_sizes, '150x150')
  return (
    <a href={'https://audius.co/' + user.handle} target="_blank" className="m-1 md:m-3 w-24 h-24 md:w-20 md:h-20 flex-shrink-0">
      <img
        src={img}
        alt="User Profile"
        className="w-24 h-24 md:w-20 md:h-20 border-2 border-light-green rounded"
      />
    </a>
  )
}
