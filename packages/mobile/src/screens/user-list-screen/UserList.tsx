import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ID, User } from '@audius/common'
import { useFocusEffect, useIsFocused } from '@react-navigation/native'
import { FeatureFlags } from 'audius-client/src/common/services/remote-config'
import type { CommonState } from 'audius-client/src/common/store'
import { getUserId } from 'audius-client/src/common/store/account/selectors'
import { getUsers } from 'audius-client/src/common/store/cache/users/selectors'
import {
  loadMore,
  reset,
  setLoading
} from 'audius-client/src/common/store/user-list/actions'
import { makeGetOptimisticUserIdsIfNeeded } from 'audius-client/src/common/store/user-list/selectors'
import type { UserListStoreState } from 'audius-client/src/common/store/user-list/types'
import { View } from 'react-native'
import type { Selector } from 'react-redux'

import { Divider, FlatList } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

import { UserChip } from './UserChip'
import { UserListItem } from './UserListItem'

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
  const dispatchWeb = useDispatchWeb()
  const [isRefreshing, setIsRefreshing] = useState(true)
  const { hasMore, userIds, loading } = useSelectorWeb(userSelector, isEqual)
  const getOptimisticUserIds = makeGetOptimisticUserIdsIfNeeded({
    userIds,
    tag
  })
  const optimisticUserIds: ID[] = useSelectorWeb(getOptimisticUserIds)
  const currentUserId = useSelectorWeb(getUserId)
  const usersMap = useSelectorWeb(
    (state) => getUsers(state, { ids: optimisticUserIds }),
    isEqual
  )
  const users: User[] = useMemo(
    () =>
      optimisticUserIds
        .map((id) => usersMap[id])
        .filter((user) => user && !user.is_deactivated),
    [usersMap, optimisticUserIds]
  )

  const { isEnabled: isTippingEnabled } = useFeatureFlag(
    FeatureFlags.TIPPING_ENABLED
  )

  useFocusEffect(
    useCallback(() => {
      setIsRefreshing(true)
      setUserList()
      dispatchWeb(setLoading(tag, true))
      dispatchWeb(loadMore(tag))

      return () => {
        dispatchWeb(reset(tag))
      }
    }, [dispatchWeb, setUserList, tag])
  )

  const isEmpty = users.length === 0

  useEffect(() => {
    if (!isEmpty && !isRefreshing && !loading && isFocused) {
      cachedUsers.current = users
    }
  }, [isEmpty, isRefreshing, isFocused, loading, users])

  // hands off loading state from refreshing to loading
  useEffect(() => {
    if (loading || !users.length) {
      setIsRefreshing(false)
    }
  }, [loading, users])

  const handleEndReached = useCallback(() => {
    if (hasMore && isFocused) {
      dispatchWeb(setLoading(tag, true))
      dispatchWeb(loadMore(tag))
    }
  }, [hasMore, isFocused, dispatchWeb, tag])

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
      renderItem={({ item }) =>
        isTippingEnabled ? (
          <UserListItem user={item} tag={tag} />
        ) : (
          <UserChip user={item} currentUserId={currentUserId} />
        )
      }
      keyExtractor={(item) => item.user_id.toString()}
      ItemSeparatorComponent={isTippingEnabled ? Divider : undefined}
      onEndReached={handleEndReached}
      ListFooterComponent={loading || isRefreshing ? loadingSpinner : footer}
    />
  )
}
