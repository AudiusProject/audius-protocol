import { memo } from 'react'

import type { User } from '@audius/common/models'
import { range } from 'lodash'
import type { ListRenderItem } from 'react-native'
import { View } from 'react-native'

import { Divider } from '@audius/harmony-native'
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
  },
  footer: {
    height: spacing(8),
    marginBottom: spacing(4)
  },
  list: {
    height: '100%'
  }
}))

type UserListV2Props = {
  data: User[] | undefined
  isLoading: boolean
  fetchNextPage: () => void
  tag: string
}

export const UserList = (props: UserListV2Props) => {
  const { data, isLoading, fetchNextPage, tag } = props
  const styles = useStyles()

  const isEmpty = !data || data.length === 0

  const displayData = [...(data ?? []), ...(isLoading ? skeletonData : [])]

  const renderItem: ListRenderItem<User | SkeletonItem> = ({ item }) =>
    '_loading' in item ? (
      <UserListItemSkeleton tag={tag} />
    ) : (
      <MemoizedUserListItem user={item} tag={tag} />
    )

  const loadingSpinner = (
    <LoadingSpinner style={[styles.spinner, isEmpty && styles.emptySpinner]} />
  )

  const footer = <View style={styles.footer} />

  return (
    <FlatList
      style={styles.list}
      data={displayData}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ItemSeparatorComponent={Divider}
      onEndReached={fetchNextPage}
      onEndReachedThreshold={3}
      ListFooterComponent={isLoading ? loadingSpinner : footer}
    />
  )
}
