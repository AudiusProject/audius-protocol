import { memo, useCallback, useMemo } from 'react'

import { useCurrentUserId } from '@audius/common/api'
import type { ID, User } from '@audius/common/models'
import { range } from 'lodash'
import type { ListRenderItem } from 'react-native'

import { Divider, Flex } from '@audius/harmony-native'
import { FlatList } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { makeStyles } from 'app/styles'

import { UserListItem } from './UserListItem'
import { UserListItemSkeleton } from './UserListItemSkeleton'

const FOLLOW_BUTTON_HEIGHT = 32
const USER_LIST_ITEM_HEIGHT = 154
const SPECIAL_USER_LIST_ITEM_HEIGHT = 171

const keyExtractor = (item: { user_id: ID } | SkeletonItem) =>
  item.user_id.toString()
const DEFAULT_SKELETON_COUNT = 10

type SkeletonItem = {
  _loading: true
  user_id: string
}

// Currently there is a lot of complex data that can change in users.
// This is a nearly static list, with only follow/unfollow actions
// The follow/unfollow action is handled by the follow button
const MemoizedUserListItem = memo(UserListItem, () => true)

const useStyles = makeStyles(({ spacing }) => ({
  spinner: {
    alignSelf: 'center',
    height: spacing(8),
    width: spacing(8),
    marginBottom: spacing(4)
  },
  emptySpinner: {
    marginTop: spacing(4)
  }
}))

type UserListProps = {
  /**
   * The list of users to display
   */
  data?: ID[]
  /**
   * If the number of users is known, use this prop to display the correct number of skeletons
   */
  totalCount?: number
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
   * Tag for the UserListItem component
   */
  tag: string
  /**
   * Whether to show ranks (1, 2, 3, etc.) next to users
   */
  showRank?: boolean
  /**
   * Function to render the right content for each user row
   */
  renderRightContent?: (userId: ID, index: number) => React.ReactNode
}

export const UserList = (props: UserListProps) => {
  const {
    data = [],
    totalCount,
    isFetchingNextPage,
    isPending,
    fetchNextPage,
    tag,
    showRank = false,
    renderRightContent
  } = props
  const { data: currentUserId } = useCurrentUserId()
  const styles = useStyles()

  const isEmpty = data.length === 0

  const skeletonData: SkeletonItem[] = useMemo(() => {
    const loadedCount = data.length

    const skeletonCount = totalCount
      ? Math.min(totalCount - loadedCount, DEFAULT_SKELETON_COUNT)
      : DEFAULT_SKELETON_COUNT

    return range(skeletonCount).map((index) => ({
      _loading: true,
      user_id: `skeleton ${index}`
    }))
  }, [totalCount, data])

  const displayData = useMemo(() => {
    return [
      ...data.map((id) => ({ user_id: id })),
      ...(isPending || isFetchingNextPage ? skeletonData : [])
    ]
  }, [data, isPending, isFetchingNextPage, skeletonData])

  const renderItem: ListRenderItem<User | SkeletonItem> = useCallback(
    ({ item, index }) =>
      '_loading' in item ? (
        <UserListItemSkeleton tag={tag} />
      ) : (
        <MemoizedUserListItem
          userId={item.user_id}
          tag={tag}
          showRank={showRank}
          rank={showRank ? index + 1 : undefined}
          renderRightContent={renderRightContent}
        />
      ),
    [tag, showRank, renderRightContent]
  )

  const getItemLayout = useCallback(
    (data: typeof displayData, index: number) => {
      const hasFollowButton = data?.[index].user_id !== currentUserId
      const baseHeight =
        tag === 'SUPPORTING' || tag === 'TOP SUPPORTERS'
          ? SPECIAL_USER_LIST_ITEM_HEIGHT
          : USER_LIST_ITEM_HEIGHT

      const height = hasFollowButton
        ? baseHeight
        : baseHeight - FOLLOW_BUTTON_HEIGHT

      return {
        length: height,
        offset: height * index,
        index
      }
    },
    [currentUserId, tag]
  )

  const loadingSpinner = (
    <LoadingSpinner style={[styles.spinner, isEmpty && styles.emptySpinner]} />
  )

  const footer = <Flex h='2xl' mb='l' />

  return (
    <FlatList
      style={{ height: '100%' }}
      data={displayData}
      getItemLayout={getItemLayout}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ItemSeparatorComponent={Divider}
      onEndReached={fetchNextPage}
      onEndReachedThreshold={3}
      ListFooterComponent={
        isFetchingNextPage || isPending ? loadingSpinner : footer
      }
    />
  )
}
