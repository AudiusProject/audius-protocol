import { CommonState } from '~/store/commonStore'

export const shareModalState = (state: CommonState) => state.ui.shareModal

export const getShareState = (state: CommonState) => shareModalState(state)
export const getShareContent = (state: CommonState) =>
  shareModalState(state).content
export const getShareSource = (state: CommonState) =>
  shareModalState(state).source
