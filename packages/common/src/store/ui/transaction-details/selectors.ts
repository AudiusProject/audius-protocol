import { CommonState } from '~/store/reducers'

export const getTransactionDetails = (state: CommonState) =>
  state.ui.transactionDetails
