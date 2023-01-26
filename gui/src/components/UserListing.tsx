import { gql } from '@apollo/client'
import {
  Container,
  Avatar,
  Button,
  Group,
  Loader,
  LoadingOverlay,
  Skeleton,
  Stack,
  Text,
} from '@mantine/core'
import { useEffect, useMemo, useRef, useState } from 'react'
import { apolloClient } from '../clients'
import {
  User,
  UserListingDocument,
  UserListingQuery,
  useUserListingQuery,
} from '../generated/graphql'
import { LinkTo } from './LinkTo'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useInfiniteQuery } from '@tanstack/react-query'

gql`
  query UserListing(
    $followed: Boolean
    $limit: Int
    $offset: Int = 0
    $query: String
    $has_reposted_track_id: ID
    $has_favorited_track_id: ID
    $is_following_user_id: ID
    $is_followed_by_user_id: ID
  ) {
    users(
      query: $query
      has_reposted_track_id: $has_reposted_track_id
      has_favorited_track_id: $has_favorited_track_id
      is_following_user_id: $is_following_user_id
      is_followed_by_user_id: $is_followed_by_user_id
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

export type UserListingProps = {
  has_reposted_track_id?: string
  has_favorited_track_id?: string
  is_following_user_id?: string
  is_followed_by_user_id?: string

  total_count: number
}

export function UserListing(props: UserListingProps) {
  const [query, setQuery] = useState('')

  const pageSize = 100

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['projects'],
    queryFn: loadMore,
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage.rows.length) return
      const rows = pages.flatMap((d) => d.rows)
      // console.log(lastPage, pages)
      return rows.length
    },
  })

  const parentRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: props.total_count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  })

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

  let allUsers = known?.users || []
  if (data) {
    allUsers = allUsers.concat(data.pages.flatMap((d) => d.rows))
  }

  // useEffect(() => {
  //   if (known) {
  //     setAllUsers(known.users)
  //   }
  // }, [known])

  // const allUsers = data ? data.pages.flatMap((d) => d.rows) : []
  // console.log(data)

  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse()

    if (!lastItem) {
      return
    }

    if (
      lastItem.index >= allUsers.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage()
    }
  }, [
    hasNextPage,
    fetchNextPage,
    allUsers.length,
    isFetchingNextPage,
    rowVirtualizer.getVirtualItems(),
  ])

  async function loadMore({ pageParam = 0 }) {
    console.log({ hasNextPage, pageParam, pageSize })
    const result = await apolloClient.query({
      query: UserListingDocument,
      variables: {
        ...commonVariables,
        followed: false,
        limit: pageSize,
        offset: pageParam,
      },
    })

    const rows = result.data?.users || []
    // console.log('rows', rows)

    return {
      rows,
      // nextOffset: pageParam + rows.length + 1,
    }

    // if (result.data?.users.length) {
    //   setAllUsers((users) => {
    //     const ok = users.concat(result.data.users)
    //     return ok
    //   })
    // }
  }

  if (!allUsers.length)
    return (
      <Container p={24} sx={{ textAlign: 'center' }}>
        <Loader />
      </Container>
    )

  return (
    <div>
      <div
        ref={parentRef}
        className="List"
        style={{
          height: `500px`,
          width: `100%`,
          overflow: 'auto',
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const isLoaderRow = virtualRow.index > allUsers.length - 1
            const user = allUsers[virtualRow.index]

            let inner = (
              <Group p={8} noWrap>
                <Skeleton height={75} circle />
                <Skeleton height={25} width="80%" />
              </Group>
            )
            if (!isLoaderRow) {
              inner = (
                <LinkTo key={user.id} item={user}>
                  <Group p={8} noWrap>
                    <Avatar
                      src={user.profile_picture_urls[0]}
                      size={75}
                      radius={75}
                    />
                    <div style={{ flexGrow: 1 }}>
                      <Text weight={'bold'}>{user.name}</Text>
                      <Text>
                        @{user.handle} {virtualRow.index} / {props.total_count}{' '}
                        : {hasNextPage ? 'more' : 'done'}
                      </Text>
                      <Text size="sm">{user.follower_count} Followers</Text>
                    </div>

                    {user.is_followed ? (
                      <Button>Following</Button>
                    ) : (
                      <Button variant="outline">Follow</Button>
                    )}
                  </Group>
                </LinkTo>
              )
            }

            return (
              <div
                key={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {inner}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
