import { CommonState } from '../commonStore'

export const getGatedTrackSignatureMap = (state: CommonState) =>
  state.gatedContent.gatedTrackSignatureMap

export const getGatedTrackStatusMap = (state: CommonState) =>
  state.gatedContent.statusMap

export const getLockedContentId = (state: CommonState) =>
  state.gatedContent.lockedContentId

export const getFolloweeIds = (state: CommonState) =>
  state.gatedContent.followeeIds

export const getTippedUserIds = (state: CommonState) =>
  state.gatedContent.tippedUserIds
