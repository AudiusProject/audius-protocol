import { getUser } from '~/store/cache/users/selectors'
import { CommonState } from '~/store/commonStore'

export const getBaseState = (state: CommonState) => state.pages.ai

export const getLineup = (state: CommonState) => getBaseState(state).tracks

export const getAiUserId = (state: CommonState) =>
  getBaseState(state).page.userId

export const getAiUserHandle = (state: CommonState) =>
  getBaseState(state).page.handle

export const getCount = (state: CommonState) => getBaseState(state).page.count

export const getAiUser = (state: CommonState) => {
  const id = getAiUserId(state)
  return getUser(state, { id })
}
