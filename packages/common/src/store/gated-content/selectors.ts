import { CommonState } from '../commonStore'

export const getNftAccessSignatureMap = (state: CommonState) =>
  state.gatedContent.nftAccessSignatureMap

export const getGatedTrackStatusMap = (state: CommonState) =>
  state.gatedContent.statusMap

export const getLockedContentId = (state: CommonState) =>
  state.gatedContent.lockedContentId

export const getFolloweeIds = (state: CommonState) =>
  state.gatedContent.followeeIds

export const getTippedUserIds = (state: CommonState) =>
  state.gatedContent.tippedUserIds
