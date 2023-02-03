import { useCallback, useEffect } from 'react'

import {
  accountSelectors,
  mutualsUserListActions,
  mutualsUserListSelectors,
  MUTUALS_USER_LIST_TAG,
  userListActions
} from '@audius/common'
import { IconCompose } from '@audius/stems'
import { useDispatch } from 'react-redux'

import { useSelector } from 'common/hooks/useSelector'
import { SearchUsersModal } from 'components/search-users-modal/SearchUsersModal'
import { MessageUserSearchResult } from 'pages/chat-page/components/CreateChatUserResult'

const messages = {
  title: 'New Message'
}

const { getAccountUser } = accountSelectors

export const CreateChatModal = () => {
  const dispatch = useDispatch()
  const currentUser = useSelector(getAccountUser)

  const { userIds, loading, hasMore } = useSelector(
    mutualsUserListSelectors.getUserList
  )

  const loadMore = useCallback(() => {
    if (currentUser) {
      dispatch(mutualsUserListActions.setMutuals(currentUser?.user_id))
      dispatch(userListActions.loadMore(MUTUALS_USER_LIST_TAG))
    }
  }, [dispatch, currentUser])

  useEffect(() => {
    loadMore()
  }, [loadMore])

  return (
    <SearchUsersModal
      modalName='CreateChat'
      titleProps={{ title: messages.title, icon: <IconCompose /> }}
      defaultUserList={{
        userIds,
        loadMore,
        loading,
        hasMore
      }}
      renderUser={(user, closeModal) => (
        <MessageUserSearchResult
          key={user.user_id}
          user={user}
          closeModal={closeModal}
        />
      )}
    />
  )
}
