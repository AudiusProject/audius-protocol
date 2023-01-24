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
}

type SetMessageReactionPayload = {
  chatId: string
  messageId: string
  reaction: string
}

const initialState: ChatState = {
  chatList: {
    status: Status.IDLE,
    data: []
  },
  chatMessages: {}
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
      _state,
      _action: PayloadAction<SetMessageReactionPayload>
    ) => {
      // triggers saga
    },
    setMessageReactionSucceeded: (
      state,
      action: PayloadAction<
        SetMessageReactionPayload & { userId: ID; createdAt: string }
      >
    ) => {
      const { userId, chatId, messageId, reaction } = action.payload
      const index = state.chatMessages[chatId].data.findIndex(
        (message) => message.message_id === messageId
      )
      const encodedUserId = encodeHashId(userId)
      if (index > -1) {
        const existingReactions = (
          state.chatMessages[chatId].data[index].reactions ?? []
        ).filter((r) => r.user_id !== encodedUserId)
        state.chatMessages[chatId].data[index].reactions = [
          ...existingReactions,
          {
            user_id: encodedUserId,
            reaction,
            created_at: dayjs().toISOString()
          }
        ]
      }
    },
    markChatAsRead: (_state, _action: PayloadAction<{ chatId: string }>) => {
      // triggers saga
    },
    sendMessage: (
      _state,
      _action: PayloadAction<{ chatId: string; message: string }>
    ) => {
      // triggers saga
    },
    addMessage: (
      state,
      action: PayloadAction<{ chatId: string; message: ChatMessage }>
    ) => {
      const { chatId, message } = action.payload
      state.chatMessages[chatId].data.unshift(message)
    },
    upsertChat: (state, action: PayloadAction<{ chat: UserChat }>) => {
      const { chat } = action.payload
      if (!state.chatList.data) {
        console.warn('ChatList not initialized')
        return
      }
      const index = state.chatList.data.findIndex(
        (c) => c.chat_id === chat.chat_id
      )
      if (index > -1) {
        // remove existing
        state.chatList.data.splice(index, 1)
      }
      // Assume new message and put at top of list
      state.chatList.data.unshift(chat)
    },
    updateMessageReactions: (
      state,
      action: PayloadAction<{ chatId: string; message: ChatMessage }>
    ) => {
      const { chatId, message } = action.payload
      if (!state.chatMessages[chatId]?.data) {
        console.warn('ChatMessages not initialized')
        return
      }
      const index = state.chatMessages[chatId].data.findIndex(
        (m) => m.message_id === message.message_id
      )
      if (index > -1) {
        state.chatMessages[chatId].data[index].reactions = message.reactions
      }
    }
  }
})

export const actions = slice.actions

export default slice.reducer
