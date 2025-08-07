import { createCustomAction } from 'typesafe-actions'

export const SET_COIN_LEADERBOARD =
  'COIN_LEADERBOARD_USER_PAGE/SET_COIN_LEADERBOARD'

export const setCoinLeaderboard = createCustomAction(
  SET_COIN_LEADERBOARD,
  (mint: string | null) => ({
    mint
  })
)
