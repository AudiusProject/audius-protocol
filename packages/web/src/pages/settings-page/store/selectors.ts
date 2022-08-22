import { CommonState } from '@audius/common'

export const getBrowserNotificationSettings = (state: CommonState) => {
  return state.pages.settings.browserNotifications
}

export const getPushNotificationSettings = (state: CommonState) => {
  return state.pages.settings.pushNotifications
}
