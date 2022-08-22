import { CommonState } from 'store/commonStore'

const getBaseState = (state: CommonState) => state.pages.settings

export const getBrowserNotificationSettings = (state: CommonState) => {
  return getBaseState(state).browserNotifications
}

export const getPushNotificationSettings = (state: CommonState) => {
  return getBaseState(state).pushNotifications
}

export const getEmailFrequency = (state: CommonState) => {
  return getBaseState(state).emailFrequency
}
