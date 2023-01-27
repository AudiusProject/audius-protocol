import type { UserChat } from '@audius/sdk'
import dayjs from 'dayjs'
import { createSelector } from 'reselect'

import { Status } from 'models/Status'
import { accountSelectors } from 'store/account'
import { cacheUsersSelectors } from 'store/cache'
import { CommonState } from 'store/reducers'
import { decodeHashId } from 'utils/hashIds'
const { getUserId } = accountSelectors
const { getUsers } = cacheUsersSelectors

export const getChat = (state: CommonState, chatId?: string) =>
  chatId
    ? state.pages.chat.chatList.data?.find((chat) => chat.chat_id === chatId)
    : undefined

export const getChatsRaw = (state: CommonState) =>
  state.pages.chat.chatList.data

export const getChatsStatus = (state: CommonState) =>
  state.pages.chat.chatList.status

export const getChatsSummary = (state: CommonState) =>
  state.pages.chat.chatList.summary

export const getOptimisticReads = (state: CommonState) =>
  state.pages.chat.optimisticChatRead

export const getAllChatMessages = (state: CommonState) =>
  state.pages.chat.chatMessages

export const getChatMessagesSummary = (state: CommonState, chatId: string) =>
  state.pages.chat.chatMessages[chatId]?.summary

export const getChatMessagesRaw = (state: CommonState, chatId: string) =>
  state.pages.chat.chatMessages[chatId]?.data

export const getChatMessagesStatus = (state: CommonState, chatId: string) =>
  state.pages.chat.chatMessages[chatId]?.status ?? Status.IDLE

export const getOptimisticReactions = (state: CommonState) =>
  state.pages.chat.optimisticReactions

export const getChats = createSelector(
  [getChatsRaw, getAllChatMessages, getOptimisticReads],
  (chats, allMessages, optimisticReads) => {
    return chats?.map((chat) => {
      // If have a clientside optimistic read status, override the server status
      if (optimisticReads?.[chat.chat_id]) {
        chat = {
          ...chat,
          ...optimisticReads[chat.chat_id]
        }
      }

      // If have newer messages on the client than the server's version for the chat,
      // use that instead for the last_message and last_message_at
      const chatMessages = allMessages[chat.chat_id]?.data
      if (
        chatMessages &&
        chatMessages.length > 0 &&
        chatMessages[0] &&
        dayjs(chatMessages[0].created_at).isAfter(chat.last_message_at)
      ) {
        chat = {
          ...chat,
          last_message_at: chatMessages[0].created_at,
          last_message: chatMessages[0].message
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
            optimisticReaction,
            ...(message.reactions?.filter(
              (reaction) => optimisticReaction.user_id !== reaction.user_id
            ) ?? [])
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
