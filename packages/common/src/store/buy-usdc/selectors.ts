import { CommonState } from 'store/reducers'

export const getBuyUSDCProvider = (state: CommonState) => state.buyUSDC.provider

export const getBuyUSDCFlowStage = (state: CommonState) => state.buyUSDC.stage

export const getBuyUSDCFlowError = (state: CommonState) => state.buyUSDC.error

export const getOnSuccess = (state: CommonState) => state.buyUSDC.onSuccess

export const getStripeSessionStatus = (state: CommonState) =>
  state.buyUSDC.stripeSessionStatus

export const getRecoveryStatus = (state: CommonState) =>
  state.buyUSDC.recoveryStatus
