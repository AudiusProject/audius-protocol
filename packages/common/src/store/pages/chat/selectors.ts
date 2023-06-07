import { ChatPermission, UserChat } from '@audius/sdk'
import { createSelector } from 'reselect'

import { ID } from 'models/Identifiers'
import { Status } from 'models/Status'
import { accountSelectors } from 'store/account'
import { cacheUsersSelectors } from 'store/cache'
import { CommonState } from 'store/reducers'
import { decodeHashId } from 'utils/hashIds'
import { Maybe } from 'utils/typeUtils'

import { chatMessagesAdapter, chatsAdapter } from './slice'
import { ChatPermissionAction } from './types'
const { getUserId } = accountSelectors
const { getUsers } = cacheUsersSelectors

const { selectById: selectChatById, selectAll: selectAllChats } =
  chatsAdapter.getSelectors<CommonState>((state) => state.pages.chat.chats)

const {
  selectAll: getAllChatMessages,
  selectById,
  selectIds: getChatMessageIds
} = chatMessagesAdapter.getSelectors()

export const getChatsStatus = (state: CommonState) =>
  state.pages.chat.chats.status

export const getChatsSummary = (state: CommonState) =>
  state.pages.chat.chats.summary

export const getHasMoreChats = (state: CommonState) => {
  const { status, summary } = state.pages.chat.chats
  return (
    status === Status.IDLE || (!!summary?.prev_count && summary.prev_count > 0)
  )
}

export const getOptimisticReads = (state: CommonState) =>
  state.pages.chat.optimisticChatRead

export const getOptimisticReactions = (state: CommonState) =>
  state.pages.chat.optimisticReactions

export const getBlockees = (state: CommonState) => state.pages.chat.blockees

export const getBlockers = (state: CommonState) => state.pages.chat.blockers

const getChatPermissions = (state: CommonState) => state.pages.chat.permissions

// Gets a chat and its optimistic read status
export const getChat = createSelector(
  [
    selectChatById,
    getOptimisticReads,
    (_: CommonState, chatId: string) => chatId
  ],
  (chat, optimisticReads, chatId) => {
    if (!chat) return undefined
    return {
      ...chat,
      ...optimisticReads[chatId]
    }
  }
)

export const getNonOptimisticChat = selectChatById

/**
 * Gets all chats and their optimistic read status
 */
export const getChats = createSelector(
  [selectAllChats, getOptimisticReads],
  (chats, optimisticReads) => {
    return chats?.map((chat) => {
      // If have a clientside optimistic read status, override the server status
      if (optimisticReads?.[chat.chat_id]) {
        chat = {
          ...chat,
          ...optimisticReads[chat.chat_id]
        }
      }
      return chat
    })
  }
)

export const getChatMessages = createSelector(
  [
    (state: CommonState, chatId: string) =>
      getAllChatMessages(
        state.pages.chat.messages[chatId] ??
          chatMessagesAdapter.getInitialState()
      ),
    getOptimisticReactions
  ],
  (messages, optimisticReactions) => {
    return messages?.map((message) => {
      const optimisticReaction = optimisticReactions[message.message_id]
      if (optimisticReaction) {
        return {
          ...message,
          reactions: [
            ...(message.reactions?.filter(
              (reaction) => optimisticReaction.user_id !== reaction.user_id
            ) ?? []),
            optimisticReaction
          ]
        }
      }
      return message
    })
  }
)

export const getUnreadMessagesCount = (state: CommonState) => {
  if (state.pages.chat.optimisticUnreadMessagesCount) {
    return state.pages.chat.optimisticUnreadMessagesCount
  }
  return state.pages.chat.unreadMessagesCount
}

export const getHasUnreadMessages = (state: CommonState) =>
  getUnreadMessagesCount(state) > 0

export const getOtherChatUsersFromChat = (
  state: CommonState,
  chat?: UserChat
) => {
  if (!chat) {
    return []
  }
  const currentUserId = getUserId(state)
  const ids = chat.chat_members
    .filter((u) => decodeHashId(u.user_id) !== currentUserId)
    .map((u) => decodeHashId(u.user_id) ?? -1)
    .filter((u) => u > -1)
  const users = getUsers(state, {
    ids
  })
  return Object.values(users)
}

export const getOtherChatUsers = (state: CommonState, chatId?: string) => {
  if (!chatId) {
    return []
  }
  const chat = getChat(state, chatId)
  return getOtherChatUsersFromChat(state, chat)
}

export const getSingleOtherChatUser = (state: CommonState, chatId?: string) => {
  return getOtherChatUsers(state, chatId)[0]
}

export const getChatMessageByIndex = (
  state: CommonState,
  chatId: string,
  messageIndex: number
) => {
  const chatMessagesState = state.pages.chat.messages[chatId]
  if (!chatMessagesState) return undefined
  const messageIds = getChatMessageIds(chatMessagesState)
  const messageIdAtIndex = messageIds[messageIndex]
  return selectById(chatMessagesState, messageIdAtIndex)
}

export const getChatMessageById = (
  state: CommonState,
  chatId: string,
  messageId: string
) => {
  const chatMessagesState = state.pages.chat.messages[chatId]
  if (!chatMessagesState) return undefined
  return selectById(chatMessagesState, messageId)
}

export const getReactionsPopupMessageId = (state: CommonState) => {
  return state.pages.chat.reactionsPopupMessageId
}

export const isIdEqualToReactionsPopupMessageId = (
  state: CommonState,
  messageId: string
) => {
  return messageId === getReactionsPopupMessageId(state)
}

export const getUnfurlMetadata = (
  state: CommonState,
  chatId: string,
  messageId: string
) => {
  const message = getChatMessageById(state, chatId, messageId)
  return message?.unfurlMetadata
}

export const getUserChatPermissions = createSelector(
  [getChatPermissions, getUserId],
  (permissions, userId) => {
    return userId ? permissions[userId] : undefined
  }
)

export const getDoesBlockUser = createSelector(
  [getBlockees, (_state: CommonState, userId: ID) => userId],
  (blockees, userId) => blockees.includes(userId)
)

export const getCanCreateChat = createSelector(
  [
    getUserId,
    getBlockees,
    getBlockers,
    getChatPermissions,
    (state: CommonState, { userId }: { userId: Maybe<ID> }) => {
      if (!userId) return null
      const usersMap = getUsers(state, { ids: [userId] })
      return usersMap[userId]
    }
  ],
  (
    currentUserId,
    blockees,
    blockers,
    chatPermissions,
    user
  ): { canCreateChat: boolean; callToAction: ChatPermissionAction } => {
    if (!currentUserId) {
      return {
        canCreateChat: false,
        callToAction: ChatPermissionAction.SIGN_UP
      }
    }
    if (!user) {
      return {
        canCreateChat: true,
        callToAction: ChatPermissionAction.NOT_APPLICABLE
      }
    }

    const userPermissions = chatPermissions[user.user_id]
    const isBlockee = blockees.includes(user.user_id)
    const isBlocker = blockers.includes(user.user_id)
    const canCreateChat =
      !isBlockee &&
      !isBlocker &&
      (userPermissions?.current_user_has_permission ?? true)

    let action = ChatPermissionAction.NOT_APPLICABLE
    if (!canCreateChat) {
      if (!userPermissions) {
        action = ChatPermissionAction.WAIT
      } else if (
        userPermissions.permits === ChatPermission.NONE ||
        blockers.includes(user.user_id)
      ) {
        action = ChatPermissionAction.NONE
      } else if (
        userPermissions.permits === ChatPermission.FOLLOWEES &&
        !user?.does_current_user_follow
      ) {
        action = ChatPermissionAction.NONE
      } else if (blockees.includes(user.user_id)) {
        action = ChatPermissionAction.UNBLOCK
      } else if (userPermissions.permits === ChatPermission.TIPPERS) {
        action = ChatPermissionAction.TIP
      }
    }
    return {
      canCreateChat,
      callToAction: action
    }
  }
)

export const getCanSendMessage = createSelector(
  [
    getBlockees,
    getBlockers,
    getCanCreateChat,
    (_state: CommonState, { userId }: { userId: Maybe<ID> }) => userId,
    (state: CommonState, { chatId }: { chatId: Maybe<string> }) =>
      chatId ? getChat(state, chatId)?.recheck_permissions : false
  ],
  (
    blockees,
    blockers,
    { canCreateChat, callToAction: createChatCallToAction },
    userId,
    recheckPermissions
  ) => {
    if (!userId) {
      return {
        canSendMessage: false,
        callToAction: ChatPermissionAction.NONE
      }
    }
    const isBlockee = blockees.includes(userId)
    const isBlocker = blockers.includes(userId)
    if (isBlocker) {
      return {
        canSendMessage: false,
        callToAction: ChatPermissionAction.NONE
      }
    }
    if (isBlockee) {
      return {
        canSendMessage: false,
        callToAction: ChatPermissionAction.UNBLOCK
      }
    }
    if (recheckPermissions && !canCreateChat) {
      return {
        canSendMessage: false,
        callToAction: createChatCallToAction
      }
    }
    return {
      canSendMessage: true,
      callToAction: ChatPermissionAction.NOT_APPLICABLE
    }
  }
)
