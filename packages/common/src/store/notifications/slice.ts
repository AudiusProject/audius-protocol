import { createEntityAdapter, createSlice } from '@reduxjs/toolkit'

import { Status } from '~/models/Status'
import { signOut } from '~/store/sign-out/slice'

import {
  AddNotificationsAction,
  FetchNotificationsAction,
  FetchNotificationsFailedAction,
  Notification,
  NotificationsState,
  UpdateNotificationsAction
} from './types'

export const notificationsAdapter = createEntityAdapter<Notification>({
  sortComparer: (a, b) =>
    a.timestamp < b.timestamp ? 1 : a.timestamp > b.timestamp ? -1 : 0
})

const initialState: NotificationsState = {
  ...notificationsAdapter.getInitialState(),
  status: Status.IDLE,
  totalUnviewed: 0,
  hasMore: true
}

const slice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    fetchNotifications(state, _action: FetchNotificationsAction) {
      state.status = Status.LOADING
    },
    fetchNotificationsFailed(state, _action: FetchNotificationsFailedAction) {
      state.status = Status.ERROR
    },
    addNotifications(state, action: AddNotificationsAction) {
      const { notifications, totalUnviewed, hasMore } = action.payload
      notificationsAdapter.addMany(state, notifications)
      state.status = Status.SUCCESS
      state.totalUnviewed = totalUnviewed
      state.hasMore = hasMore
    },
    updateNotifications(state, action: UpdateNotificationsAction) {
      const { notifications, totalUnviewed, hasMore } = action.payload
      notificationsAdapter.upsertMany(state, notifications)
      state.status = Status.SUCCESS
      state.totalUnviewed = totalUnviewed
      state.hasMore = hasMore
    },
    refreshNotifications(state) {
      state.status = Status.LOADING
    },
    markAllAsViewed(state) {
      notificationsAdapter.updateMany(
        state,
        state.ids.map((id) => ({
          id,
          changes: { isViewed: true }
        }))
      )
      state.totalUnviewed = 0
    }
  },
  extraReducers: {
    [signOut.type]: () => {
      return initialState
    }
  }
})

export const actions = slice.actions
const reducer = slice.reducer

export default reducer
