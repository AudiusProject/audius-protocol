import { gql } from '@apollo/client'
import { Avatar, Group, Modal, Table } from '@mantine/core'
import { Link, useParams } from 'react-router-dom'
import { apolloClient } from '../clients'
import { PlayButton } from '../components/Player'
import { TrackTable } from '../components/TrackTable'
import { UserListing } from '../components/UserListing'
import { useProfileQuery } from '../generated/graphql'

gql`
  fragment TrackOwner on User {
    id
    name
    handle
    bio

    track_count
    following_count
    follower_count

    is_followed
    is_follower

    cover_photo_urls
    profile_picture_urls
  }
`

gql`
  query Profile($handle: String) {
    user(handle: $handle) {
      id
      handle
      name
      cover_photo_urls(size: _2000x)
      profile_picture_urls
      follower_count
      following_count
      tracks(limit: 100) {
        cover_art_urls

        owner {
          ...TrackOwner
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

      playlists(limit: 100) {
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
      <div style={{ padding: '0px 40px' }}>
        <h3>Tracks</h3>
        <TrackTable tracks={user.tracks} />

        <h3>Playlists</h3>
        {user.playlists.map((playlist) => (
          <div key={playlist.id}>
            <Link to={`/${handle}/playlist/${playlist.name}`}>
              {playlist.name}
            </Link>
          </div>
        ))}

        <Group align="top">
          <div>
            <h4>Following: {user.following_count}</h4>
            <UserListing is_followed_by_user_id={user.id} />
          </div>

          <div>
            <h4>Followers: {user.follower_count}</h4>
            <UserListing is_following_user_id={user.id} />
          </div>
        </Group>
      </div>
    </div>
  )
}
