import { useCallback, useEffect } from 'react'

import { useFeatureFlag } from '@audius/common/hooks'
import { User } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  accountSelectors,
  chatActions,
  chatSelectors,
  searchUsersModalActions,
  useCreateChatModal,
  createChatModalActions,
  useInboxUnavailableModal,
  userListActions,
  followersUserListActions,
  followersUserListSelectors,
  FOLLOWERS_USER_LIST_TAG
} from '@audius/common/store'
import { IconCompose } from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { useSelector } from 'common/hooks/useSelector'
import { SearchUsersModal } from 'components/search-users-modal/SearchUsersModal'
import { CreateChatUserResult } from 'pages/chat-page/components/CreateChatUserResult'

import { ChatBlastCTA } from './ChatBlastCTA'
import { CreateChatEmptyResults } from './CreateChatEmptyResults'

const messages = {
  title: 'New Message'
}

const { getUserId } = accountSelectors
const { getUserList: getFollowersUserList } = followersUserListSelectors
const { getUserList: getChatsUserList } = chatSelectors
const { fetchBlockers, fetchMoreChats } = chatActions

export const CreateChatModal = () => {
  const { isEnabled: isChatBlastsEnabled } = useFeatureFlag(
    FeatureFlags.ONE_TO_MANY_DMS
  )

  const dispatch = useDispatch()
  const currentUserId = useSelector(getUserId)
  const { isOpen, onClose, onClosed, data } = useCreateChatModal()
  const { onOpen: openInboxUnavailableModal } = useInboxUnavailableModal()
  const { onCancelAction, presetMessage, defaultUserList } = data

  const followersUserList = useSelector(getFollowersUserList)
  const chatsUserList = useSelector(getChatsUserList)
  const { userIds, hasMore, loading } =
    defaultUserList === 'chats' ? chatsUserList : followersUserList

  const handleCancel = useCallback(() => {
    if (onCancelAction) {
      dispatch(onCancelAction)
    }
  }, [onCancelAction, dispatch])

  const loadMore = useCallback(() => {
    if (currentUserId) {
      if (defaultUserList === 'chats') {
        dispatch(fetchMoreChats())
      } else {
        dispatch(followersUserListActions.setFollowers(currentUserId))
        dispatch(userListActions.loadMore(FOLLOWERS_USER_LIST_TAG))
      }
    }
  }, [dispatch, defaultUserList, currentUserId])

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
        footer={
          isChatBlastsEnabled ? <ChatBlastCTA onClick={onClose} /> : undefined
        }
      />
    </>
  )
}

export default CreateChatModal
