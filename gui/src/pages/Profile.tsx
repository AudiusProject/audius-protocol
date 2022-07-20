import { gql } from '@apollo/client'
import { Link, useParams } from 'react-router-dom'
import { useProfileQuery } from '../generated/graphql'

gql`
  query Profile($handle: String) {
    users(handle: $handle) {
      id
      handle
      name
      tracks(limit: 100) {
        id
        title
        favorite_count
        favorited_by {
          id
          handle
        }
        repost_count
        reposted_by {
          id
          handle
        }
        stream_urls
      }

      playlists {
        id
        name
      }
    }
  }
`

export function Profile() {
  const { handle } = useParams()
  const { data, loading, error } = useProfileQuery({
    variables: {
      handle,
    },
  })
  if (loading) return <div>loading</div>
  if (error) return <div>error</div>

  const user = data?.users[0]
  if (!user) return <div>not found</div>

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.handle}</p>
      <hr />

      <h3>Playlists</h3>
      {user.playlists.map((playlist) => (
        <div key={playlist.id}>
          <Link to={`/${handle}/playlist/${playlist.name}`}>
            {playlist.name}
          </Link>
        </div>
      ))}

      <h3>Tracks</h3>
      {user.tracks.map((track) => (
        <div key={track.id}>
          <h2>{track.title}</h2>

          <div>
            <audio src={track.stream_urls[0]} controls={true} />
          </div>
          <Link to={`/${user.handle}/${track.title}`}>permalink</Link>
          {/* <LinkTo item={track}>permalink</LinkTo> */}

          <div>
            {track.favorite_count} favs
            <ul>
              {track.favorited_by.map((user) => (
                <li key={user.id}>
                  <Link to={`/${user.handle}`}>{user.handle}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            {track.repost_count} reposts
            <ul>
              {track.reposted_by.map((user) => (
                <li key={user.id}>{user.handle}</li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  )
}
