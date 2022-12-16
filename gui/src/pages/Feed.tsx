import { gql } from '@apollo/client'
import { useMeQuery } from '../generated/graphql'

gql`
  query Me {
    me {
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

export function Feed() {
  const { data } = useMeQuery()
  return (
    <div>
      Feed
      <h1>{data?.me?.handle}</h1>
    </div>
  )
}
