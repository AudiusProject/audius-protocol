import { CommonState } from 'store/reducers'

export const getChatsSummary = (state: CommonState) =>
  state.pages.chat.chatList.summary

export const getChats = (state: CommonState) => state.pages.chat.chatList.data

export const getChatMessagesSummary = (state: CommonState, chatId: string) =>
  state.pages.chat.chatMessages[chatId].summary

export const getChatMessages = (state: CommonState, chatId: string) =>
  state.pages.chat.chatMessages[chatId]?.data

export const getCurrentChatId = (state: CommonState) =>
  state.pages.chat.currentChatId
