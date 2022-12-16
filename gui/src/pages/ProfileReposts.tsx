import { gql } from '@apollo/client'
import { Container } from '@mantine/core'
import { useLoaderData, useParams } from 'react-router-dom'
import { TrackTable } from '../components/TrackTable'
import {
  ProfileLayoutQuery,
  ProfileRepostsQuery,
  useProfileRepostsQuery,
} from '../generated/graphql'

gql`
  query ProfileReposts($handle: String) {
    user(handle: $handle) {
      id

      repost_count
      reposted_tracks(limit: 100) {
        id
        title
        cover_art_urls
        favorite_count
        repost_count
        stream_urls

        owner {
          ...TrackOwner
        }
      }
    }
  }
`

export function ProfileReposts() {
  const { handle } = useParams()
  const { data, loading, error } = useProfileRepostsQuery({
    variables: {
      handle,
    },
  })

  if (!data?.user) return null

  return (
    <Container size="xl">
      {data.user.repost_count} Reposts
      <TrackTable tracks={data.user.reposted_tracks} />
    </Container>
  )
}
