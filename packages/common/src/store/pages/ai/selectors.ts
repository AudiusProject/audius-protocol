import { CommonState } from '~/store/commonStore'

export const getBaseState = (state: CommonState) => state.pages.ai

export const getLineup = (state: CommonState) => getBaseState(state).tracks

export const getAiUserHandle = (state: CommonState) =>
  getBaseState(state).page.handle
