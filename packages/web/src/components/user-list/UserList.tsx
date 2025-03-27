import { useCallback, useMemo } from 'react'

import { useCurrentUserId } from '@audius/common/api'
import { ID, FollowSource } from '@audius/common/models'
import { Flex, useScrollbarRef } from '@audius/harmony'
import { range } from 'lodash'
import InfiniteScroll from 'react-infinite-scroller'

import { FollowButton } from 'components/follow-button/FollowButton'

import { UserListArtistChip } from './UserListArtistChip'
import { UserListItemSkeleton } from './UserListItemSkeleton'

const SCROLL_THRESHOLD = 400
const DEFAULT_SKELETON_COUNT = 10

type UserListProps = {
  /**
   * The list of users to display
   */
  data: ID[] | undefined
  /**
   * If the number of users is known, use this prop to display the correct number of skeletons
   */
  totalCount?: number
  /**
   * Whether there are more users to load
   */
  hasNextPage: boolean
  /**
   * Whether we're loading more users
   */
  isFetchingNextPage: boolean
  /**
   * Whether we're loading the initial data
   */
  isPending: boolean
  /**
   * Function to load more users
   */
  fetchNextPage?: () => void
  /**
   * Optional user ID to show support for (used in top supporters list)
   */
  showSupportFor?: ID
  /**
   * Optional user ID to show support from (used in supporting list)
   */
  showSupportFrom?: ID
}

export const UserList = ({
  data,
  totalCount,
  hasNextPage,
  isFetchingNextPage,
  isPending,
  fetchNextPage,
  showSupportFor,
  showSupportFrom
}: UserListProps) => {
  const { data: currentUserId } = useCurrentUserId()
  const scrollRef = useScrollbarRef()

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage?.()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const showSkeletons = isPending || isFetchingNextPage
  const loadedCount = data?.length ?? 0

  const skeletonData = useMemo(() => {
    // Determine the tag for skeleton items based on whether we're showing support info
    let skeletonTag: string | undefined
    if (showSupportFor) {
      skeletonTag = 'TOP SUPPORTERS'
    } else if (showSupportFrom) {
      skeletonTag = 'SUPPORTING'
    }

    const skeletonCount = totalCount
      ? Math.min(totalCount - loadedCount, DEFAULT_SKELETON_COUNT)
      : DEFAULT_SKELETON_COUNT

    return range(skeletonCount).map((index) => ({
      key: `skeleton ${index}`,
      tag: skeletonTag
    }))
  }, [totalCount, showSupportFor, showSupportFrom, loadedCount])

  return (
    <Flex h='100%' column>
      <InfiniteScroll
        pageStart={0}
        loadMore={handleLoadMore}
        hasMore={hasNextPage}
        useWindow={false}
        initialLoad={false}
        threshold={SCROLL_THRESHOLD}
        getScrollParent={scrollRef ? () => scrollRef?.current : undefined}
        css={(theme) => ({
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.s,
          padding: theme.spacing.s
        })}
      >
        {data?.map((userId) => (
          <Flex
            alignItems='center'
            justifyContent='space-between'
            borderBottom='strong'
            p='m'
            key={userId}
          >
            <UserListArtistChip
              userId={userId}
              showSupportFor={showSupportFor}
              showSupportFrom={showSupportFrom}
            />
            {userId !== currentUserId && (
              <FollowButton
                size='small'
                fullWidth={false}
                source={FollowSource.USER_LIST}
                userId={userId}
              />
            )}
          </Flex>
        ))}
        {showSkeletons
          ? skeletonData.map((skeleton) => (
              <UserListItemSkeleton key={skeleton.key} tag={skeleton.tag} />
            ))
          : null}
      </InfiniteScroll>
    </Flex>
  )
}
