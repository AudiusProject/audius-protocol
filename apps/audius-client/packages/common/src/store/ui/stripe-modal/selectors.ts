import { CommonState } from 'store/commonStore'

export const getStripeModalState = (state: CommonState) => state.ui.stripeModal
