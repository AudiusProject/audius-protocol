import { gql } from '@apollo/client'
import { Avatar, Group, Modal, Table } from '@mantine/core'
import { Link, useParams } from 'react-router-dom'
import { PlayButton } from '../components/Player'
import { ImageCard } from '../components/user/CoverFade'
import { useProfileQuery } from '../generated/graphql'

gql`
  query Profile($handle: String) {
    user(handle: $handle) {
      id
      handle
      name
      cover_photo_urls(size: _2000x)
      profile_picture_urls
      tracks(limit: 100) {
        cover_art_urls

        owner {
          id
          name
          handle
        }

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

  const user = data?.user
  if (!user) return <div>not found</div>

  return (
    <div>
      {/* profile header cover stuff */}
      <div
        style={{
          position: 'relative',
          height: 320,
          backgroundImage: `url(${user.cover_photo_urls[0]})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          marginBottom: 100,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, .85) 90%)',
          }}
        ></div>
        <Group
          style={{
            position: 'absolute',
            bottom: -70,
            color: 'white',
          }}
        >
          <Avatar src={user.profile_picture_urls[0]} size={150} radius={150} />
          <div>
            <div>{user.name}</div>
            <div>@{user.handle}</div>
          </div>
        </Group>
      </div>

      <h3>Tracks</h3>
      <Table>
        <tbody>
          {user.tracks.map((track) => (
            <tr key={track.id}>
              <td>
                <PlayButton track={track} trackList={user.tracks} />
                <b>{track.title}</b>
              </td>

              <td>{track.favorite_count} favs</td>
              <td>{track.repost_count} reposts</td>

              <td>
                {/* {track.id} */}
                <Link
                  to={`/${user.handle}/${encodeURIComponent(track.title)}/${
                    track.id
                  }`}
                >
                  permalink
                </Link>
                {/* <LinkTo item={track}>permalink</LinkTo> */}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <h3>Playlists</h3>
      {user.playlists.map((playlist) => (
        <div key={playlist.id}>
          <Link to={`/${handle}/playlist/${playlist.name}`}>
            {playlist.name}
          </Link>
        </div>
      ))}
    </div>
  )
}
