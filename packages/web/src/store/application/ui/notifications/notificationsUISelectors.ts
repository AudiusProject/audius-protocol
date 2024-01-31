import {
  notificationsSelectors,
  AnnouncementNotification
} from '@audius/common/store'
import { Nullable } from '@audius/common/utils'

import { AppState } from 'store/types'

const { selectNotificationById } = notificationsSelectors
const getBaseState = (state: AppState) => state.application.ui.notifications

export const getNotificationPanelIsOpen = (state: AppState) =>
  getBaseState(state).panelIsOpen

export const getNotificationModalIsOpen = (state: AppState) =>
  getBaseState(state).modalIsOpen

export const getNotificationModalId = (state: AppState) =>
  getBaseState(state).modalNotificationId

export const getModalNotification = (state: AppState) => {
  const notificationId = getBaseState(state).modalNotificationId
  if (!notificationId) return null
  return selectNotificationById(
    state,
    notificationId
  ) as Nullable<AnnouncementNotification>
}
