import { CommonState } from '../commonStore'

export const getPremiumTrackSignatureMap = (state: CommonState) =>
  state.premiumContent.premiumTrackSignatureMap

export const getPremiumTrackStatusMap = (state: CommonState) =>
  state.premiumContent.statusMap

export const getLockedContentId = (state: CommonState) =>
  state.premiumContent.lockedContentId

export const getPurchaseContentId = (state: CommonState) =>
  state.premiumContent.purchaseContentId

export const getFolloweeIds = (state: CommonState) =>
  state.premiumContent.followeeIds

export const getTippedUserIds = (state: CommonState) =>
  state.premiumContent.tippedUserIds
