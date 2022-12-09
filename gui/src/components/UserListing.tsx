import { gql } from '@apollo/client'
import { Avatar, Button, Group, Stack, Text } from '@mantine/core'
import { useEffect, useMemo, useState } from 'react'
import { apolloClient } from '../clients'
import {
  User,
  UserListingDocument,
  UserListingQuery,
  useUserListingQuery,
} from '../generated/graphql'
import { LinkTo } from './LinkTo'

gql`
  query UserListing(
    $followed: Boolean
    $limit: Int
    $offset: Int = 0
    $query: String
    $has_reposted_track_id: ID
    $has_favorited_track_id: ID
  ) {
    users(
      query: $query
      has_reposted_track_id: $has_reposted_track_id
      has_favorited_track_id: $has_favorited_track_id
      is_followed_by_current_user: $followed
      limit: $limit
      offset: $offset
    ) {
      id
      handle
      name
      follower_count
      is_followed
      profile_picture_urls
    }
  }
`

type UserListingProps = {
  has_reposted_track_id?: string
  has_favorited_track_id?: string
}

export function UserListing(props: UserListingProps) {
  const [allUsers, setAllUsers] = useState<UserListingQuery['users']>([])
  const [query, setQuery] = useState('')

  const pageSize = 100
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const commonVariables = {
    query,
    ...props,
  }

  const { data: known } = useUserListingQuery({
    variables: {
      ...commonVariables,
      followed: true,
      limit: 1000,
    },
  })

  const { data: unknown } = useUserListingQuery({
    variables: {
      ...commonVariables,
      followed: false,
      limit: pageSize,
    },
  })

  useEffect(() => {
    if (known && unknown) {
      setAllUsers(known.users.concat(unknown.users))
      setHasMore(unknown.users.length == pageSize)
    }
  }, [known, unknown])

  async function loadMore() {
    const o = offset + pageSize
    setOffset(o)

    const result = await apolloClient.query({
      query: UserListingDocument,
      variables: {
        ...commonVariables,
        followed: false,
        limit: pageSize,
        offset: o,
      },
    })

    if (result.data?.users) {
      setHasMore(result.data.users.length == pageSize)
      setAllUsers((users) => users.concat(result.data.users))
    } else {
      setHasMore(false)
    }
  }

  return (
    <div style={{ maxWidth: 500 }}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {allUsers.map((user) => (
        <LinkTo key={user.id} item={user}>
          <Group p={8}>
            <Avatar src={user.profile_picture_urls[0]} size={75} radius={75} />
            <div style={{ flexGrow: 1 }}>
              <Text weight={'bold'}>{user.name}</Text>
              <Text>@{user.handle}</Text>
              <Text size="sm">{user.follower_count} Followers</Text>
            </div>

            {user.is_followed ? (
              <Button>Following</Button>
            ) : (
              <Button variant="outline">Follow</Button>
            )}
          </Group>
        </LinkTo>
      ))}

      {hasMore && <button onClick={loadMore}>load more</button>}
    </div>
  )
}
