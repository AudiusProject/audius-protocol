import { buildImageUrls } from './AudiusSurvivalKit'

export function TrackTile({ track }: { track: any }) {
  const img = buildImageUrls(track.user, track.cover_art_sizes, '150x150')
  return (
    <a href={'https://audius.co' + track.permalink} target="_blank">
      <img
        src={img}
        width={80}
        style={{ margin: 3, border: '2px solid gold' }}
      />
    </a>
  )
}

export function PlaylistTile({ playlist }: { playlist: any }) {
  const img = buildImageUrls(playlist.user, playlist.cover_art_sizes, '150x150')
  return (
    <a href={'https://audius.co/#todo_playlist_url'} target="_blank">
      <img
        src={img}
        width={80}
        style={{
          margin: 3,
          border: '2px solid purple',
        }}
      />
    </a>
  )
}

export function UserTile({ user }: { user: any }) {
  const img = buildImageUrls(user, user.profile_picture_sizes, '150x150')
  return (
    <a href={'https://audius.co/' + user.handle} target="_blank">
      <img
        src={img}
        width={80}
        style={{ margin: 3, border: '2px solid lightgreen' }}
      />
    </a>
  )
}
