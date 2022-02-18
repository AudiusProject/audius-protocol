import { useCallback, useMemo } from 'react'

import { CommonState } from 'audius-client/src/common/store'
import { getUserId } from 'audius-client/src/common/store/account/selectors'
import { getUsers } from 'audius-client/src/common/store/cache/users/selectors'
import { loadMore } from 'audius-client/src/common/store/user-list/actions'
import { UserListStoreState } from 'audius-client/src/common/store/user-list/types'
import { FlatList } from 'react-native'
import { Selector } from 'react-redux'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

import { UserChip } from './UserChip'

const useStyles = makeStyles(({ palette }) => ({
  root: { backgroundColor: palette.white }
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
}

export const UserList = (props: UserListProps) => {
  const { tag, userSelector } = props
  const styles = useStyles()
  const dispatchWeb = useDispatchWeb()
  const { hasMore, userIds } = useSelectorWeb(userSelector)
  const currentUserId = useSelectorWeb(getUserId)
  const usersMap = useSelectorWeb(state => getUsers(state, { ids: userIds }))
  const users = useMemo(
    () =>
      userIds
        .map(id => usersMap[id])
        .filter(user => user && !user.is_deactivated),
    [usersMap, userIds]
  )

  const handleEndReached = useCallback(() => {
    if (hasMore) {
      dispatchWeb(loadMore(tag))
    }
  }, [hasMore, dispatchWeb, tag])

  return (
    <FlatList
      style={styles.root}
      data={users}
      renderItem={({ item }) => (
        <UserChip user={item} currentUserId={currentUserId} />
      )}
      onEndReached={handleEndReached}
    />
  )
}
