import { useCallback, useEffect } from 'react'

import {
  accountSelectors,
  chatActions,
  userListActions,
  FOLLOWERS_USER_LIST_TAG,
  followersUserListActions,
  followersUserListSelectors
} from '@audius/common'
import { IconCompose } from '@audius/stems'
import { useDispatch } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { useSelector } from 'common/hooks/useSelector'
import { SearchUsersModal } from 'components/search-users-modal/SearchUsersModal'
import { MessageUserSearchResult } from 'pages/chat-page/components/CreateChatUserResult'

const messages = {
  title: 'New Message'
}

const { getAccountUser } = accountSelectors
const { fetchBlockers } = chatActions

const CREATE_CHAT_MODAL = 'CreateChat'

export const CreateChatModal = () => {
  const dispatch = useDispatch()
  const currentUser = useSelector(getAccountUser)
  const [isVisible] = useModalState(CREATE_CHAT_MODAL)

  const { userIds, loading, hasMore } = useSelector(
    followersUserListSelectors.getUserList
  )

  const loadMore = useCallback(() => {
    if (currentUser) {
      dispatch(followersUserListActions.setFollowers(currentUser?.user_id))
      dispatch(userListActions.loadMore(FOLLOWERS_USER_LIST_TAG))
    }
  }, [dispatch, currentUser])

  useEffect(() => {
    loadMore()
  }, [loadMore])

  useEffect(() => {
    if (isVisible) {
      dispatch(fetchBlockers())
    }
  }, [dispatch, isVisible])

  return (
    <SearchUsersModal
      modalName={CREATE_CHAT_MODAL}
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
