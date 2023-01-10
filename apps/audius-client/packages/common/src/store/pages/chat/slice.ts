import type { TypedCommsResponse, UserChat, ChatMessage } from '@audius/sdk'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { Status } from 'models'

type ChatState = {
  currentChatId?: string
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
    setCurrentChat: (state, action: PayloadAction<{ chatId: string }>) => {
      state.currentChatId = action.payload.chatId
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
    }
  }
})

export const actions = slice.actions

export default slice.reducer
