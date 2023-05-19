import { ChatPermission, UserChat } from '@audius/sdk'
import { createSelector } from 'reselect'

import { ID } from 'models/Identifiers'
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

/**
 * Gets a single chat (without optimistic read status)
 */
export const getChat = selectChatById

// Selectors for UserChat (all chats for a user)
export const getChatsStatus = (state: CommonState) =>
  state.pages.chat.chats.status

export const getChatsSummary = (state: CommonState) =>
  state.pages.chat.chats.summary

export const getOptimisticReads = (state: CommonState) =>
  state.pages.chat.optimisticChatRead

export const getOptimisticReactions = (state: CommonState) =>
  state.pages.chat.optimisticReactions

export const getBlockees = (state: CommonState) => state.pages.chat.blockees

export const getBlockers = (state: CommonState) => state.pages.chat.blockers

const getChatPermissions = (state: CommonState) => state.pages.chat.permissions

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

export const getCanChat = createSelector(
  [
    getUserId,
    getBlockees,
    getBlockers,
    getChatPermissions,
    (_state: CommonState, userId: Maybe<ID>) => {
      return userId
    }
  ],
  (
    currentUserId,
    blockees,
    blockers,
    chatPermissions,
    userId
  ): { canChat: boolean; callToAction: ChatPermissionAction } => {
    if (!currentUserId) {
      return {
        canChat: false,
        callToAction: ChatPermissionAction.SIGN_UP
      }
    }
    if (!userId) {
      return {
        canChat: false,
        callToAction: ChatPermissionAction.NONE
      }
    }

    const userPermissions = chatPermissions[userId]
    const isBlockee = blockees.includes(userId)
    const isBlocker = blockers.includes(userId)
    const canChat =
      !isBlockee &&
      !isBlocker &&
      (userPermissions?.current_user_has_permission ?? false)

    let action = ChatPermissionAction.NOT_APPLICABLE
    if (!canChat) {
      if (!userPermissions) {
        action = ChatPermissionAction.WAIT
      } else if (
        userPermissions.permits === ChatPermission.NONE ||
        blockers.includes(userId)
      ) {
        action = ChatPermissionAction.NONE
      } else if (blockees.includes(userId)) {
        action = ChatPermissionAction.UNBLOCK
      } else if (userPermissions.permits === ChatPermission.TIPPERS) {
        action = ChatPermissionAction.TIP
      }
    }
    return {
      canChat,
      callToAction: action
    }
  }
)
