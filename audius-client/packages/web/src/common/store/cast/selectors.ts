import { CommonState } from 'common/store'

const getBaseState = (state: CommonState) => state.cast

export const getMethod = (state: CommonState) => getBaseState(state).method
