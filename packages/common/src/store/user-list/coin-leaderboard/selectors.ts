import { CommonState } from '~/store/commonStore'

export const getMint = (state: CommonState): string | null =>
  state.ui.userList.coinLeaderboard?.mint ?? null
