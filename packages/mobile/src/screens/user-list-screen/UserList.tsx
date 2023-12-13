import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ID, User, UserListStoreState, CommonState } from '@audius/common'
import {
  cacheUsersSelectors,
  userListActions,
  userListSelectors
} from '@audius/common'
import { useFocusEffect, useIsFocused } from '@react-navigation/native'
import { range } from 'lodash'
import { View } from 'react-native'
import type { Selector } from 'react-redux'
import { useDispatch, useSelector } from 'react-redux'

import { Divider, FlatList } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { makeStyles } from 'app/styles'

import { UserListItem } from './UserListItem'
import { UserListItemSkeleton } from './UserListItemSkeleton'
const { makeGetOptimisticUserIdsIfNeeded } = userListSelectors
const { loadMore, reset, setLoading } = userListActions
const { getUsers } = cacheUsersSelectors

const keyExtractor = (item: User) => item.user_id.toString()

const skeletonData = range(6).map((index) => ({
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

type UserListProps = {
  /**
   * A tag uniquely identifying this particular instance of a UserList in the store.
   * Because multiple lists may exist, all listening to the same actions,
   * the tag is required to forward actions to a particular UserList.
   */
  tag: string
  /**
   * Selector pointing to this particular instance of the UserList
   * in the global store.
   */
  userSelector: Selector<CommonState, UserListStoreState>
  setUserList: () => void
}

export const UserList = (props: UserListProps) => {
  const { tag, userSelector, setUserList } = props
  const isFocused = useIsFocused()
  const styles = useStyles()
  const cachedUsers = useRef<User[]>([])
  const dispatch = useDispatch()
  const [isRefreshing, setIsRefreshing] = useState(true)
  const { hasMore, userIds, loading } = useSelector(userSelector)
  const getOptimisticUserIds = makeGetOptimisticUserIdsIfNeeded({
    userIds,
    tag
  })
  const optimisticUserIds: ID[] = useSelector(getOptimisticUserIds)
  const usersMap = useSelector((state) =>
    getUsers(state, { ids: optimisticUserIds })
  )
  const users: User[] = useMemo(
    () =>
      optimisticUserIds
        .map((id) => usersMap[id])
        .filter((user) => user && !user.is_deactivated),
    [usersMap, optimisticUserIds]
  )

  useFocusEffect(
    useCallback(() => {
      setIsRefreshing(true)
      setUserList()
      dispatch(setLoading(tag, true))
      dispatch(loadMore(tag))

      return () => {
        dispatch(reset(tag))
      }
    }, [dispatch, setUserList, tag])
  )

  const isEmpty = users.length === 0

  useEffect(() => {
    if (!isEmpty && !isRefreshing && !loading && isFocused) {
      cachedUsers.current = users
    }
  }, [isEmpty, isRefreshing, isFocused, loading, users])

  // hands off loading state from refreshing to loading
  useEffect(() => {
    if (isRefreshing) {
      if (loading || !users.length) {
        setIsRefreshing(false)
      }
    }
  }, [loading, users, isRefreshing])

  const handleEndReached = useCallback(() => {
    if (hasMore && isFocused) {
      dispatch(setLoading(tag, true))
      dispatch(loadMore(tag))
    }
  }, [hasMore, isFocused, dispatch, tag])

  const shouldUseCachedData = isEmpty || isRefreshing || loading || !isFocused

  const data = useMemo(() => {
    const userData = shouldUseCachedData ? cachedUsers.current : users
    return [...userData, ...skeletonData]
  }, [shouldUseCachedData, users])

  const renderItem = useCallback(
    ({ item }) =>
      '_loading' in item ? (
        <UserListItemSkeleton tag={tag} />
      ) : (
        <MemoizedUserListItem user={item} tag={tag} />
      ),

    [tag]
  )

  const getItemLayout = useCallback(
    (_data: User[], index: number) => {
      const itemHeight = ['SUPPORTING', 'TOP SUPPORTERS'].includes(tag)
        ? 167
        : 147
      return {
        length: itemHeight,
        offset: itemHeight * index,
        index
      }
    },
    [tag]
  )

  const loadingSpinner = (
    <LoadingSpinner
      style={[styles.spinner, data.length === 0 && styles.emptySpinner]}
    />
  )

  const footer = <View style={styles.footer} />

  return (
    <FlatList
      style={styles.list}
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      ItemSeparatorComponent={Divider}
      onEndReached={handleEndReached}
      onEndReachedThreshold={3}
      ListFooterComponent={loading || isRefreshing ? loadingSpinner : footer}
    />
  )
}
