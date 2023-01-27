import type { TypedCommsResponse, UserChat, ChatMessage } from '@audius/sdk'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import dayjs from 'dayjs'

import { ID, Status } from 'models'
import { encodeHashId } from 'utils/hashIds'

type ChatState = {
  chatList: {
    status: Status
    summary?: TypedCommsResponse<UserChat>['summary']
    data: UserChat[]
  }
  chatMessages: Record<
    string,
    {
      status: Status
      summary?: TypedCommsResponse<ChatMessage>['summary']
      data: ChatMessage[]
    }
  >
  optimisticReactions: Record<string, ChatMessage['reactions'][number]>
  optimisticChatRead: Record<string, UserChat>
}

type SetMessageReactionPayload = {
  userId: ID
  chatId: string
  messageId: string
  reaction: string
}

const initialState: ChatState = {
  chatList: {
    status: Status.IDLE,
    data: []
  },
  chatMessages: {},
  optimisticChatRead: {},
  optimisticReactions: {}
}

const chatSortComparator = (a: UserChat, b: UserChat) =>
  dayjs(a.last_message_at).isBefore(dayjs(b.last_message_at)) ? 1 : -1

const slice = createSlice({
  name: 'application/pages/chat',
  initialState,
  reducers: {
    createChat: (_state, _action: PayloadAction<{ userIds: ID[] }>) => {
      // triggers saga
    },
    createChatSucceeded: (state, action: PayloadAction<{ chat: UserChat }>) => {
      const { chat } = action.payload
      state.chatList.data = [chat].concat(state.chatList.data)
    },
    fetchMoreChats: (state) => {
      // triggers saga
      state.chatList.status = Status.LOADING
    },
    fetchMoreChatsSucceeded: (
      state,
      action: PayloadAction<TypedCommsResponse<UserChat[]>>
    ) => {
      state.chatList.status = Status.SUCCESS
      state.chatList.data = state.chatList.data.concat(action.payload.data)
      state.chatList.summary = action.payload.summary
    },
    fetchMoreChatsFailed: (state) => {
      state.chatList.status = Status.ERROR
    },
    fetchMoreMessages: (state, action: PayloadAction<{ chatId: string }>) => {
      // triggers saga
      if (!state.chatMessages[action.payload.chatId]) {
        state.chatMessages[action.payload.chatId] = {
          data: [],
          status: Status.LOADING
        }
      } else {
        state.chatMessages[action.payload.chatId].status = Status.LOADING
      }
    },
    fetchMoreMessagesSucceeded: (
      state,
      action: PayloadAction<{
        response: TypedCommsResponse<ChatMessage[]>
        chatId: string
      }>
    ) => {
      const {
        chatId,
        response: { data, summary }
      } = action.payload
      state.chatMessages[chatId].status = Status.SUCCESS
      state.chatMessages[chatId].data =
        state.chatMessages[chatId].data.concat(data)
      state.chatMessages[chatId].summary = summary
    },
    fetchMoreMessagesFailed: (
      state,
      action: PayloadAction<{ chatId: string }>
    ) => {
      const { chatId } = action.payload
      state.chatMessages[chatId].status = Status.ERROR
    },
    setMessageReaction: (
      state,
      action: PayloadAction<SetMessageReactionPayload>
    ) => {
      // triggers saga
      // Optimistically set reaction
      const { userId, messageId, reaction } = action.payload
      const encodedUserId = encodeHashId(userId)
      state.optimisticReactions[messageId] = {
        user_id: encodedUserId,
        reaction,
        created_at: dayjs().toISOString()
      }
    },
    setMessageReactionSucceeded: (
      state,
      action: PayloadAction<SetMessageReactionPayload>
    ) => {
      // Set the true state
      const { userId, chatId, messageId, reaction } = action.payload
      delete state.optimisticReactions[messageId]
      const index = state.chatMessages[chatId].data.findIndex(
        (message) => message.message_id === messageId
      )
      const encodedUserId = encodeHashId(userId)
      if (index > -1) {
        const existingReactions =
          state.chatMessages[chatId].data[index].reactions ?? []
        state.chatMessages[chatId].data[index].reactions = [
          ...existingReactions.filter((r) => r.user_id !== encodedUserId),
          {
            user_id: encodedUserId,
            reaction,
            created_at: dayjs().toISOString()
          }
        ]
      }
    },
    setMessageReactionFailed: (
      state,
      action: PayloadAction<SetMessageReactionPayload>
    ) => {
      // Reset our optimism :(
      const { messageId } = action.payload
      delete state.optimisticReactions[messageId]
    },
    fetchChatSucceeded: (state, action: PayloadAction<{ chat: UserChat }>) => {
      const { chat } = action.payload
      if (!state.chatList.data.find((c) => c.chat_id === chat.chat_id)) {
        state.chatList.data.push(chat)
        state.chatList.data.sort(chatSortComparator)
      }
    },
    markChatAsRead: (state, action: PayloadAction<{ chatId: string }>) => {
      // triggers saga
      // Optimistically mark as read
      const { chatId } = action.payload
      const existingChat = state.chatList.data.find((c) => c.chat_id === chatId)
      if (existingChat) {
        state.optimisticChatRead[chatId] = {
          ...existingChat,
          last_read_at: existingChat.last_message_at,
          unread_message_count: existingChat.unread_message_count
        }
      }
    },
    markChatAsReadSucceeded: (
      state,
      action: PayloadAction<{ chatId: string }>
    ) => {
      // Set the true state
      const { chatId } = action.payload
      delete state.optimisticChatRead[chatId]
      const index = state.chatList.data.findIndex((c) => c.chat_id === chatId)
      if (index > -1) {
        state.chatList.data[index].last_read_at =
          state.chatList.data[index].last_message_at
        state.chatList.data[index].unread_message_count = 0
      }
    },
    markChatAsReadFailed: (
      state,
      action: PayloadAction<{ chatId: string }>
    ) => {
      // Reset our optimism :(
      const { chatId } = action.payload
      delete state.optimisticChatRead[chatId]
    },
    sendMessage: (
      _state,
      _action: PayloadAction<{ chatId: string; message: string }>
    ) => {
      // triggers saga which will add a message optimistically and replace it after success
    },
    addMessage: (
      state,
      action: PayloadAction<{ chatId: string; message: ChatMessage }>
    ) => {
      // triggers saga to get chat if not exists
      const { chatId, message } = action.payload
      state.chatMessages[chatId].data.unshift(message)
    },
    sendMessageSucceeded: (
      state,
      action: PayloadAction<{
        chatId: string
        oldMessageId: string
        message: ChatMessage
      }>
    ) => {
      const { chatId, oldMessageId, message } = action.payload
      const index = state.chatMessages[chatId].data.findIndex(
        (m) => m.message_id === oldMessageId
      )
      if (index > -1) {
        state.chatMessages[chatId].data[index] = message
      }
    },
    sendMessageFailed: (
      state,
      action: PayloadAction<{
        chatId: string
        attemptedMessageId: string
      }>
    ) => {
      const { chatId, attemptedMessageId } = action.payload
      const index = state.chatMessages[chatId].data.findIndex(
        (m) => m.message_id === attemptedMessageId
      )
      if (index > -1) {
        delete state.chatMessages[chatId].data[index]
      }
    }
  }
})

export const actions = slice.actions

export default slice.reducer
