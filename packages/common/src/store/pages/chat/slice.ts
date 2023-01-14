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
    fetchNewChatMessages: (
      state,
      action: PayloadAction<{ chatId: string }>
    ) => {
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
    fetchNewChatMessagesSucceeded: (
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
      state.chatMessages[chatId].data = data.concat(
        state.chatMessages[chatId].data
      )
      state.chatMessages[chatId].summary = summary
    },
    fetchNewChatMessagesFailed: (
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
    }
  }
})

export const actions = slice.actions

export default slice.reducer
