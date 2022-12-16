import { gql } from '@apollo/client'
import { Avatar, Container } from '@mantine/core'
import { useParams } from 'react-router-dom'
import { LinkTo } from '../components/LinkTo'
import { LoadingStates } from '../components/LoadingStates'
import { TrackTable } from '../components/TrackTable'
import { usePlaylistDetailQuery } from '../generated/graphql'

gql`
  query PlaylistDetail($handle: String, $playlistSlug: String) {
    user(handle: $handle) {
      id
      handle
      name
      playlists(query: $playlistSlug, limit: 1) {
        id
        name
        image_urls(size: _480x480)

        tracks(limit: 1000) {
          id
          title
          repost_count
          favorite_count

          cover_art_urls
          stream_urls

          owner {
            ...TrackOwner
          }
        }
      }
    }
  }
`

export function PlaylistDetail() {
  const { handle, playlistSlug } = useParams()
  const { data, loading, error } = usePlaylistDetailQuery({
    variables: {
      handle,
      playlistSlug,
    },
  })

  if (loading || error) return <LoadingStates loading={loading} error={error} />

  const user = data?.user
  const playlist = user?.playlists[0]
  if (!playlist) return <div>not found</div>

  return (
    <Container>
      <h1>{playlist.name}</h1>

      <Avatar src={playlist.image_urls[0]} size={320} />

      <TrackTable tracks={playlist.tracks} />
    </Container>
  )
}
