import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { ID } from 'models/Identifiers'
import { Status } from 'models/Status'

export type SearchUsersModalState = {
  userList: {
    userIds: ID[]
    hasMore: boolean
    status: Status
  }
  lastQuery?: string
}

const initialState: SearchUsersModalState = {
  userList: {
    userIds: [],
    hasMore: true,
    status: Status.IDLE
  }
}

const slice = createSlice({
  name: 'application/ui/searchUsersModal',
  initialState,
  reducers: {
    searchUsers: (
      state,
      action: PayloadAction<{ query: string; limit?: number }>
    ) => {
      // Triggers Saga
      const { query } = action.payload
      if (state.lastQuery !== query) {
        state.userList.userIds = []
        state.lastQuery = query
      }
      state.userList.status = Status.LOADING
    },
    searchUsersSucceeded: (
      state,
      action: PayloadAction<{ userIds: number[] }>
    ) => {
      state.userList.userIds = state.userList.userIds.concat(
        action.payload.userIds
      )
      state.userList.status = Status.SUCCESS
      state.userList.hasMore = action.payload.userIds.length > 0
    }
  }
})

export const actions = slice.actions

export default slice.reducer
