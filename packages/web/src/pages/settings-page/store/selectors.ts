import { AppState } from 'store/types'

export const getBrowserNotificationSettings = (state: AppState) => {
  return state.application.pages.settings.browserNotifications
}

export const getPushNotificationSettings = (state: AppState) => {
  return state.application.pages.settings.pushNotifications
}

export const getEmailFrequency = (state: AppState) => {
  return state.application.pages.settings.emailFrequency
}

export const getCastMethod = (state: AppState) => {
  return state.application.pages.settings.castMethod
}
