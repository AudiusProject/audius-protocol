import { CommonState } from '~/store/commonStore'

export const getStripeModalState = (state: CommonState) => state.ui.stripeModal

export const getStripeClientSecret = (state: CommonState) =>
  state.ui.stripeModal.stripeClientSecret
