import type { UserChat } from '@audius/sdk'
import { createSelector } from 'reselect'

import { Status } from 'models/Status'
import { accountSelectors } from 'store/account'
import { cacheUsersSelectors } from 'store/cache'
import { CommonState } from 'store/reducers'
import { decodeHashId } from 'utils/hashIds'
const { getUserId } = accountSelectors
const { getUsers } = cacheUsersSelectors

// Selectors for UserChat (all chats for a user)
export const getChatsStatus = (state: CommonState) =>
  state.pages.chat.chatList.status

export const getChatsSummary = (state: CommonState) =>
  state.pages.chat.chatList.summary

export const getOptimisticReads = (state: CommonState) =>
  state.pages.chat.optimisticChatRead

export const getAllChatMessages = (state: CommonState) =>
  state.pages.chat.chatMessages

// Selectors for ChatMessage (specific chat conversations)
export const getChatMessagesSummary = (state: CommonState, chatId: string) =>
  state.pages.chat.chatMessages[chatId]?.summary

export const getChatMessagesRaw = (state: CommonState, chatId: string) =>
  state.pages.chat.chatMessages[chatId]?.data

export const getChatMessagesStatus = (state: CommonState, chatId: string) =>
  state.pages.chat.chatMessages[chatId]?.status ?? Status.IDLE

export const getOptimisticReactions = (state: CommonState) =>
  state.pages.chat.optimisticReactions

// Returns a UserChat that contains the ChatMessage with the given chatId
export const getChat = (state: CommonState, chatId?: string) =>
  chatId ? state.pages.chat.chatList.map[chatId] : undefined

export const getChatsRaw = createSelector(
  (state: CommonState) => state.pages.chat.chatList.order,
  (state) => state.pages.chat.chatList.map,
  (order, map) => {
    return order.map((chatId) => map[chatId])
  }
)

export const getChats = createSelector(
  [getChatsRaw, getAllChatMessages, getOptimisticReads],
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
  [getChatMessagesRaw, getOptimisticReactions],
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
