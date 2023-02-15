import type {
  TypedCommsResponse,
  UserChat,
  ChatMessage,
  ChatMessageReaction,
  ChatMessageNullableReaction
} from '@audius/sdk'
import { Action, createSlice, PayloadAction } from '@reduxjs/toolkit'
import dayjs from 'dayjs'

import { ID, Status } from 'models'
import { encodeHashId } from 'utils/hashIds'

type ChatState = {
  chatList: {
    status: Status
    summary?: TypedCommsResponse<UserChat>['summary']
    map: Record<string, UserChat>
    order: string[]
  }
  chatMessages: Record<
    string,
    {
      status: Status
      summary?: TypedCommsResponse<ChatMessage>['summary']
      data: ChatMessage[]
    }
  >
  optimisticReactions: Record<string, ChatMessageReaction>
  optimisticChatRead: Record<string, UserChat>
  activeChatId: string | null
}

type SetMessageReactionPayload = {
  userId: ID
  chatId: string
  messageId: string
  reaction: string | null
}

const initialState: ChatState = {
  chatList: {
    status: Status.IDLE,
    map: {},
    order: []
  },
  chatMessages: {},
  optimisticChatRead: {},
  optimisticReactions: {},
  activeChatId: null
}

const chatSortComparator = (a: UserChat, b: UserChat) =>
  dayjs(a.last_message_at).isBefore(dayjs(b.last_message_at)) ? 1 : -1

const getNewChatOrder = (state: ChatState) => {
  const allChats = Object.values(state.chatList.map)
  return allChats.sort(chatSortComparator).map((c) => c.chat_id)
}

const slice = createSlice({
  name: 'application/pages/chat',
  initialState,
  reducers: {
    createChat: (_state, _action: PayloadAction<{ userIds: ID[] }>) => {
      // triggers saga
    },
    createChatSucceeded: (state, action: PayloadAction<{ chat: UserChat }>) => {
      const { chat } = action.payload
      state.chatList.order.unshift(chat.chat_id)
      state.chatList.map[chat.chat_id] = chat
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
      for (const chat of action.payload.data) {
        state.chatList.order.push(chat.chat_id)
        state.chatList.map[chat.chat_id] = chat
      }
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
      if (reaction) {
        state.optimisticReactions[messageId] = {
          user_id: encodedUserId,
          reaction,
          created_at: dayjs().toISOString()
        }
      } else {
        delete state.optimisticReactions[messageId]
      }
    },
    setMessageReactionSucceeded: (
      state,
      action: PayloadAction<{
        chatId: string
        messageId: string
        reaction: ChatMessageNullableReaction
      }>
    ) => {
      // Set the true state
      const { chatId, messageId, reaction } = action.payload
      delete state.optimisticReactions[messageId]
      const index = state.chatMessages[chatId].data.findIndex(
        (message) => message.message_id === messageId
      )
      if (index > -1) {
        const existingReactions =
          state.chatMessages[chatId].data[index].reactions ?? []
        state.chatMessages[chatId].data[index].reactions =
          existingReactions.filter((r) => r.user_id !== reaction.user_id)
        if (reaction.reaction !== null) {
          state.chatMessages[chatId].data[index].reactions.push(reaction)
        }
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
      if (!state.chatList.map[chat.chat_id]) {
        state.chatList.order.push(chat.chat_id)
        state.chatList.order = getNewChatOrder(state)
      }
    },
    markChatAsRead: (state, action: PayloadAction<{ chatId: string }>) => {
      // triggers saga
      // Optimistically mark as read
      const { chatId } = action.payload
      const existingChat = state.chatList.map[chatId]
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
      if (state.chatList.map[chatId]) {
        state.chatList.map[chatId].last_read_at =
          state.chatList.map[chatId].last_message_at
        state.chatList.map[chatId].unread_message_count = 0
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
      if (state.chatMessages[chatId]) {
        state.chatMessages[chatId].data.unshift(message)
      }
      state.chatList.map[chatId].last_message = message.message
      state.chatList.map[chatId].last_message_at = message.created_at
      state.chatList.order = getNewChatOrder(state)
    },
    incrementUnreadCount: (
      state,
      action: PayloadAction<{ chatId: string }>
    ) => {
      const { chatId } = action.payload
      // If we're actively reading, this will immediately get marked as read.
      // Ignore the unread bump to prevent flicker
      if (state.activeChatId !== chatId) {
        state.chatList.map[chatId].unread_message_count += 1
      }
    },
    /**
     * Marks the chat as currently being read.
     * Prevents flicker of unread status when new messages come in if actively reading.
     */
    setActiveChat: (
      state,
      action: PayloadAction<{ chatId: string | null }>
    ) => {
      const { chatId } = action.payload
      state.activeChatId = chatId
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
    },
    connect: (_state, _action: Action) => {
      // triggers middleware
    },
    disconnect: (_state, _action: Action) => {
      // triggers middleware
    }
  }
})

export const actions = slice.actions

export default slice.reducer
