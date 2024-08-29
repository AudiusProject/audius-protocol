import { full } from '@audius/sdk'

import { StringWei } from '~/models'
import { UserTipWithUsers } from '~/models/Tipping'

import { userMetadataFromSDK } from './user'

export const userTipWithUsersFromSDK = (
  input: full.FullTip
): UserTipWithUsers | undefined => {
  const sender = userMetadataFromSDK(input.sender)
  const receiver = userMetadataFromSDK(input.receiver)
  return sender && receiver
    ? {
        sender,
        receiver,
        sender_id: sender.user_id,
        receiver_id: receiver.user_id,
        amount: input.amount as StringWei,
        created_at: input.createdAt,
        // Intentionally empty for performance reasons
        followee_supporter_ids: [],
        followee_supporters: input.followeeSupporters.map(({ userId }) => ({
          user_id: userId
        })),
        slot: input.slot,
        tx_signature: input.txSignature
      }
    : undefined
}
