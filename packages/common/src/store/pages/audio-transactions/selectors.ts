import { CommonState } from '../../commonStore'

export const getAudioTransactions = (state: CommonState) =>
  state.pages.audioTransactions.transactions
export const getAudioTransactionsCount = (state: CommonState) =>
  state.pages.audioTransactions.transactionsCount
