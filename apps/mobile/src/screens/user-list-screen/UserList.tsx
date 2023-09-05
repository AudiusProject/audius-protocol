import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ID, User, UserListStoreState, CommonState } from '@audius/common'
import {
  cacheUsersSelectors,
  userListActions,
  userListSelectors
} from '@audius/common'
import { useFocusEffect, useIsFocused } from '@react-navigation/native'
import { View } from 'react-native'
import type { Selector } from 'react-redux'
import { useDispatch, useSelector } from 'react-redux'

import { Divider, FlatList } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { makeStyles } from 'app/styles'

import { UserListItem } from './UserListItem'
const { makeGetOptimisticUserIdsIfNeeded } = userListSelectors
const { loadMore, reset, setLoading } = userListActions
const { getUsers } = cacheUsersSelectors

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

  const data =
    isEmpty || isRefreshing || loading || !isFocused
      ? cachedUsers.current
      : users

  const loadingSpinner = (
    <LoadingSpinner
      style={[styles.spinner, data.length === 0 && styles.emptySpinner]}
    />
  )

  if ((loading || isRefreshing) && data.length === 0) {
    return loadingSpinner
  }

  const footer = <View style={styles.footer} />

  return (
    <FlatList
      style={styles.list}
      data={data}
      renderItem={({ item }) => <UserListItem user={item} tag={tag} />}
      keyExtractor={(item) => item.user_id.toString()}
      ItemSeparatorComponent={Divider}
      onEndReached={handleEndReached}
      ListFooterComponent={loading || isRefreshing ? loadingSpinner : footer}
    />
  )
}
