import { CommonState } from 'common/store'

export const getBrowserNotificationSettings = (state: CommonState) => {
  return state.pages.settings.browserNotifications
}

export const getPushNotificationSettings = (state: CommonState) => {
  return state.pages.settings.pushNotifications
}
