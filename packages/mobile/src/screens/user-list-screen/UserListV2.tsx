import { memo, useCallback, useMemo } from 'react'

import type { User, UserMetadata } from '@audius/common/models'
import { range } from 'lodash'
import type { ListRenderItem } from 'react-native'

import { Divider, Flex } from '@audius/harmony-native'
import { FlatList } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { makeStyles } from 'app/styles'

import { UserListItem } from './UserListItem'
import { UserListItemSkeleton } from './UserListItemSkeleton'

const keyExtractor = (item: User | SkeletonItem) => item.user_id.toString()

type SkeletonItem = {
  _loading: true
  user_id: string
}

const skeletonData: SkeletonItem[] = range(6).map((index) => ({
  _loading: true,
  user_id: `skeleton ${index}`
}))

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

type UserListV2Props = {
  /**
   * The list of users to display
   */
  data?: UserMetadata[]
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
  fetchNextPage: () => void
  /**
   * Tag for the UserListItem component
   */
  tag: string
}

export const UserListV2 = (props: UserListV2Props) => {
  const { data = [], isFetchingNextPage, isPending, fetchNextPage, tag } = props
  const styles = useStyles()

  const isEmpty = data.length === 0

  const displayData = useMemo(() => {
    return [...data, ...(isPending ? skeletonData : [])]
  }, [data, isPending])

  const renderItem: ListRenderItem<User | SkeletonItem> = useCallback(
    ({ item }) =>
      '_loading' in item ? (
        <UserListItemSkeleton tag={tag} />
      ) : (
        <MemoizedUserListItem user={item} tag={tag} />
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
