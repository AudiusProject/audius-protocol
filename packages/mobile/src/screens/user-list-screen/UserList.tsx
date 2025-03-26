import { memo, useCallback, useMemo } from 'react'

import type { ID, User } from '@audius/common/models'
import { range } from 'lodash'
import type { ListRenderItem } from 'react-native'

import { Divider, Flex } from '@audius/harmony-native'
import { FlatList } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { makeStyles } from 'app/styles'

import { UserListItem } from './UserListItem'
import { UserListItemSkeleton } from './UserListItemSkeleton'

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
}

export const UserList = (props: UserListProps) => {
  const {
    data = [],
    totalCount,
    isFetchingNextPage,
    isPending,
    fetchNextPage,
    tag
  } = props
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
    ({ item }) =>
      '_loading' in item ? (
        <UserListItemSkeleton tag={tag} />
      ) : (
        <MemoizedUserListItem userId={item.user_id} tag={tag} />
      ),
    [tag]
  )

  const loadingSpinner = (
    <LoadingSpinner style={[styles.spinner, isEmpty && styles.emptySpinner]} />
  )

  const footer = <Flex h='2xl' mb='l' />

  return (
    <FlatList
      style={{ height: '100%' }}
      data={displayData}
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
