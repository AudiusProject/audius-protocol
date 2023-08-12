import { useCallback, useEffect } from 'react'

import {
  accountSelectors,
  chatActions,
  userListActions,
  FOLLOWERS_USER_LIST_TAG,
  followersUserListActions,
  followersUserListSelectors,
  User,
  useCreateChatModal,
  useInboxUnavailableModal,
  createChatModalActions,
  searchUsersModalActions
} from '@audius/common'
import { IconCompose } from '@audius/stems'
import { useDispatch } from 'react-redux'

import { useSelector } from 'common/hooks/useSelector'
import { SearchUsersModal } from 'components/search-users-modal/SearchUsersModal'
import { CreateChatUserResult } from 'pages/chat-page/components/CreateChatUserResult'

import { CreateChatEmptyResults } from './CreateChatEmptyResults'

const messages = {
  title: 'New Message'
}

const { getAccountUser } = accountSelectors
const { fetchBlockers } = chatActions

export const CreateChatModal = () => {
  const dispatch = useDispatch()
  const currentUser = useSelector(getAccountUser)
  const { isOpen, onClose, onClosed, data } = useCreateChatModal()
  const { onOpen: openInboxUnavailableModal } = useInboxUnavailableModal()
  const { onCancelAction, presetMessage } = data

  const { userIds, loading, hasMore } = useSelector(
    followersUserListSelectors.getUserList
  )

  const handleCancel = useCallback(() => {
    if (onCancelAction) {
      dispatch(onCancelAction)
    }
  }, [onCancelAction, dispatch])

  const loadMore = useCallback(() => {
    if (currentUser) {
      dispatch(followersUserListActions.setFollowers(currentUser?.user_id))
      dispatch(userListActions.loadMore(FOLLOWERS_USER_LIST_TAG))
    }
  }, [dispatch, currentUser])

  const handleOpenInboxUnavailableModal = useCallback(
    (user: User) => {
      openInboxUnavailableModal({
        userId: user.user_id,
        presetMessage,
        onSuccessAction: searchUsersModalActions.searchUsers({ query: '' }),
        onCancelAction: createChatModalActions.open(data)
      })
      onClose()
    },
    [data, presetMessage, openInboxUnavailableModal, onClose]
  )

  useEffect(() => {
    loadMore()
  }, [loadMore])

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchBlockers())
    }
  }, [dispatch, isOpen])

  return (
    <>
      <SearchUsersModal
        titleProps={{ title: messages.title, icon: <IconCompose /> }}
        defaultUserList={{
          userIds,
          loadMore,
          loading,
          hasMore
        }}
        renderUser={(user, closeParentModal) => (
          <CreateChatUserResult
            key={user.user_id}
            user={user}
            openInboxUnavailableModal={handleOpenInboxUnavailableModal}
            closeParentModal={closeParentModal}
            presetMessage={presetMessage}
          />
        )}
        renderEmpty={() => <CreateChatEmptyResults />}
        isOpen={isOpen}
        onClose={onClose}
        onClosed={onClosed}
        onCancel={handleCancel}
      />
    </>
  )
}
