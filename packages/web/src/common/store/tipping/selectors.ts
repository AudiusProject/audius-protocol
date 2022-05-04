import { ID } from 'common/models/Identifiers'
import { CommonState } from 'common/store'
import { getUser } from 'common/store/cache/users/selectors'

export const getSupporters = (state: CommonState) => state.tipping.supporters
export const getSupportersForUser = (state: CommonState, userId: ID) =>
  getSupporters(state)[userId]

export const getSupporting = (state: CommonState) => state.tipping.supporting
export const getSupportingForUser = (state: CommonState, userId: ID) =>
  getSupporting(state)[userId]

export const getSendStatus = (state: CommonState) => state.tipping.send.status
export const getSendAmount = (state: CommonState) => state.tipping.send.amount
export const getSendUser = (state: CommonState) => state.tipping.send.user
export const getSendTipData = (state: CommonState) => state.tipping.send
export const getRecipientSPLWallet = (state: CommonState) => {
  const id = getSendUser(state)?.user_id
  if (id) {
    const recipient = getUser(state, { id })
    return recipient?.userBank ?? null
  }
  return null
}
