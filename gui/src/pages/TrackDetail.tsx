import { gql } from '@apollo/client'
import { Avatar, Group } from '@mantine/core'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { LinkTo } from '../components/LinkTo'
import { UserListing } from '../components/UserListing'
import { useTrackDetailQuery } from '../generated/graphql'

gql`
  query TrackDetail($handle: String, $trackId: ID, $reposterLimit: Int) {
    user(handle: $handle) {
      id
      handle
      name
      tracks(id: $trackId, limit: 1) {
        id
        title
        favorite_count
        favorited_by {
          id
          handle
        }
        repost_count
        reposted_by(limit: $reposterLimit) {
          id
          handle
          profile_picture_urls
        }
        stream_urls
      }
    }
  }
`

export function TrackDetail() {
  const [reposterLimit, setReposterLimit] = useState(10)
  const { handle, trackSlug, trackId } = useParams()
  const { data, loading, error } = useTrackDetailQuery({
    variables: {
      handle,
      trackId,
      reposterLimit,
    },
  })
  if (loading) return <div>loading</div>
  if (error) return <div>error</div>
  if (!data?.user) return <div>not found</div>

  const user = data.user
  const track = user.tracks[0]
  if (!track) return <div>not found</div>

  return (
    <div>
      <LinkTo item={user}>{handle}</LinkTo>
      <h1>
        {handle} {trackSlug}
      </h1>

      <Group align="top">
        <div>
          <h3>Repost Count: {track.repost_count}</h3>
          <UserListing has_reposted_track_id={track.id} />
        </div>

        <div>
          <h3>Fav Count: {track.favorite_count}</h3>
          <UserListing has_favorited_track_id={track.id} />
        </div>
      </Group>
    </div>
  )
}
