import { CommonState } from '../../commonStore'

export const getAudioTransactions = (state: CommonState) =>
  state.pages.audioTransactions.transactions
export const getAudioTransactionsStatus = (state: CommonState) =>
  state.pages.audioTransactions.transactionsStatus
export const getAudioTransactionsCount = (state: CommonState) =>
  state.pages.audioTransactions.transactionsCount
export const getAudioTransactionsCountStatus = (state: CommonState) =>
  state.pages.audioTransactions.transactionsCountStatus
