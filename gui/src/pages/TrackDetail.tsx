import { gql } from '@apollo/client'
import { Avatar, Group } from '@mantine/core'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { LinkTo } from '../components/LinkTo'
import { PlayButton } from '../components/Player'
import { UserListing } from '../components/UserListing'
import { useTrackDetailQuery } from '../generated/graphql'

gql`
  query TrackDetail($handle: String, $trackId: ID) {
    user(handle: $handle) {
      id
      handle
      name
      tracks(id: $trackId, limit: 1) {
        id
        title
        cover_art_urls(size: _480x480)
        length
        description

        owner {
          id
          handle
          name
        }

        favorite_count
        repost_count
        stream_urls
      }
    }
  }
`

export function TrackDetail() {
  const { handle, trackSlug, trackId } = useParams()
  const { data, loading, error } = useTrackDetailQuery({
    variables: {
      handle,
      trackId,
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
      <Avatar src={track.cover_art_urls[0]} size={480} />
      <h1>{track.title}</h1>
      <h1>{track.length}</h1>
      <h1>{track.description}</h1>

      <PlayButton track={track} />

      {/* <Group align="top">
        <div>
          <h3>Repost Count: {track.repost_count}</h3>
          <UserListing has_reposted_track_id={track.id} />
        </div>

        <div>
          <h3>Fav Count: {track.favorite_count}</h3>
          <UserListing has_favorited_track_id={track.id} />
        </div>
      </Group> */}
    </div>
  )
}
