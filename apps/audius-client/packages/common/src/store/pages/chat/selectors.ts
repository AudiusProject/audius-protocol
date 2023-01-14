import type { UserChat } from '@audius/sdk'

import { accountSelectors } from 'store/account'
import { cacheUsersSelectors } from 'store/cache'
import { CommonState } from 'store/reducers'
import { decodeHashId } from 'utils/hashIds'
const { getUserId } = accountSelectors
const { getUsers } = cacheUsersSelectors

export const getChatsSummary = (state: CommonState) =>
  state.pages.chat.chatList.summary

export const getChat = (state: CommonState, chatId?: string) =>
  chatId
    ? state.pages.chat.chatList.data?.find((chat) => chat.chat_id === chatId)
    : undefined

export const getChats = (state: CommonState) => state.pages.chat.chatList.data

export const getChatsStatus = (state: CommonState) =>
  state.pages.chat.chatList.status

export const getChatMessagesSummary = (state: CommonState, chatId: string) =>
  state.pages.chat.chatMessages[chatId].summary

export const getChatMessages = (state: CommonState, chatId: string) =>
  state.pages.chat.chatMessages[chatId]?.data

export const getChatMessagesStatus = (state: CommonState, chatId: string) =>
  state.pages.chat.chatMessages[chatId]?.status

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
