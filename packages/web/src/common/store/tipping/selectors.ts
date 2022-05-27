import { ID } from 'common/models/Identifiers'
import { CommonState } from 'common/store'

export const getSupporters = (state: CommonState) => state.tipping.supporters
export const getSupportersForUser = (state: CommonState, userId: ID) =>
  getSupporters(state)[userId]

export const getSupporterForUser = (
  state: CommonState,
  userId: ID,
  supporterId: ID
) => getSupporters(state)?.[userId]?.[supporterId]

export const getSupporting = (state: CommonState) => state.tipping.supporting
export const getSupportingForUser = (state: CommonState, userId: ID) =>
  getSupporting(state)[userId]

export const getSupportedUserByUser = (
  state: CommonState,
  userId: ID,
  supportingId: ID
) => getSupporting(state)?.[userId]?.[supportingId]

export const getSendStatus = (state: CommonState) => state.tipping.send.status
export const getSendAmount = (state: CommonState) => state.tipping.send.amount
export const getSendUser = (state: CommonState) => state.tipping.send.user
export const getSendTipData = (state: CommonState) => state.tipping.send

export const getRecentTips = (state: CommonState) => state.tipping.recentTips
export const getTipToDisplay = (state: CommonState) =>
  state.tipping.tipToDisplay
export const getShowTip = (state: CommonState) => state.tipping.showTip
export const getMainUser = (state: CommonState) => state.tipping.mainUser
