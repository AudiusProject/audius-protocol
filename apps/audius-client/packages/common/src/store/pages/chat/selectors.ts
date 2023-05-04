import type { UserChat } from '@audius/sdk'
import { createSelector } from 'reselect'

import { accountSelectors } from 'store/account'
import { cacheUsersSelectors } from 'store/cache'
import { CommonState } from 'store/reducers'
import { decodeHashId } from 'utils/hashIds'

import { chatMessagesAdapter, chatsAdapter } from './slice'
const { getUserId } = accountSelectors
const { getUsers } = cacheUsersSelectors

const { selectById: selectChatById, selectAll: selectAllChats } =
  chatsAdapter.getSelectors<CommonState>((state) => state.pages.chat.chats)

const {
  selectAll: getAllChatMessages,
  selectById,
  selectIds: getChatMessageIds
} = chatMessagesAdapter.getSelectors()

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

export const getUserChatPermissions = (state: CommonState) =>
  state.pages.chat.permissions

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
