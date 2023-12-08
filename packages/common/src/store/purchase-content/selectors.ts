import { CommonState } from 'store/reducers'

export const getPurchaseContentId = (state: CommonState) =>
  state.purchaseContent.contentId

export const getPurchaseContentType = (state: CommonState) =>
  state.purchaseContent.contentType

export const getPurchaseContentPage = (state: CommonState) =>
  state.purchaseContent.page

export const getPurchaseContentFlowStage = (state: CommonState) =>
  state.purchaseContent.stage

export const getPurchaseContentError = (state: CommonState) =>
  state.purchaseContent.error

export const getPurchaseContentOnSuccess = (state: CommonState) =>
  state.buyUSDC.onSuccess
