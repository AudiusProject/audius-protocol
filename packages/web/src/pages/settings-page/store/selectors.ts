import { CommonState } from '@audius/common/store'

export const getBrowserNotificationSettings = (state: CommonState) => {
  return state.pages.settings.browserNotifications
}

export const getPushNotificationSettings = (state: CommonState) => {
  return state.pages.settings.pushNotifications
}
