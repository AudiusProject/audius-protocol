import { SupportedUserMetadata, SupporterMetadata } from '~/models'

import { SupportersMapForUser, SupportingMapForUser } from './types'

export const makeSupportingMapForUser = (
  supportedUsers: SupportedUserMetadata[]
): SupportingMapForUser =>
  supportedUsers.reduce((out, { receiver, amount, rank }) => {
    const receiver_id = receiver.user_id
    out[receiver_id] = {
      receiver_id,
      rank,
      amount
    }
    return out
  }, {})

export const makeSupportersMapForUser = (
  supporters: SupporterMetadata[]
): SupportersMapForUser =>
  supporters.reduce((out, { sender, amount, rank }) => {
    const sender_id = sender.user_id
    out[sender_id] = {
      sender_id,
      rank,
      amount
    }
    return out
  }, {})
