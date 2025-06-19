import { useMemo } from 'react'

import { AUDIO, AudioWei } from '@audius/fixed-decimal'

import { useCurrentUserId, useSupporter, useSupporters } from '~/api'
import { Nullable } from '~/utils/typeUtils'

const zeroAudioWei = AUDIO('0').value
const oneAudioWei = AUDIO('1').value

export const useSupporterPrompt = (receiverId?: Nullable<number>) => {
  const { data: accountUserId } = useCurrentUserId()

  // Get the top supporter
  const { data: supporters = [], isPending: isSupportersPending } =
    useSupporters({
      userId: receiverId,
      pageSize: 1
    })
  const topSupporter = supporters[0]

  // Get the current user's support amount
  const {
    data: currentUserSupporter,
    isPending: isCurrentUserSupporterPending
  } = useSupporter({ userId: receiverId, supporterUserId: accountUserId })

  // Compute if they would be first supporter
  const isFirstSupporter =
    !accountUserId || !receiverId
      ? false
      : !topSupporter && !currentUserSupporter

  // Compute amount needed to dethrone current top supporter
  const amountToDethrone = useMemo(() => {
    if (
      !accountUserId ||
      !receiverId ||
      !topSupporter ||
      accountUserId === topSupporter.sender.user_id
    ) {
      return null
    }

    const topSupporterAmountWei = BigInt(topSupporter.amount) as AudioWei
    const currentUserAmountWei = currentUserSupporter
      ? (BigInt(currentUserSupporter.amount) as AudioWei)
      : zeroAudioWei

    // Amount needed is (top supporter amount - current user amount + 1 AUDIO)
    return (topSupporterAmountWei -
      currentUserAmountWei +
      oneAudioWei) as AudioWei
  }, [accountUserId, receiverId, topSupporter, currentUserSupporter])

  return {
    isPending: isSupportersPending || isCurrentUserSupporterPending,
    amountToDethrone,
    isFirstSupporter
  }
}
