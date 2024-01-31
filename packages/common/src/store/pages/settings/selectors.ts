import { getAccountUser } from '~/store/account/selectors'
import { CommonState } from '~/store/commonStore'

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

export const getAllowAiAttribution = (state: CommonState) => {
  const account = getAccountUser(state)
  if (!account) return null

  return account.allow_ai_attribution
}
