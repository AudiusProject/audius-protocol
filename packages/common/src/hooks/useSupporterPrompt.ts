import { useMemo } from 'react'

import { useSelector } from 'react-redux'

import { useSupporter, useSupporters } from '~/api'
import { BNWei, StringWei } from '~/models'
import { accountSelectors } from '~/store'
import { Nullable } from '~/utils/typeUtils'
import { parseAudioInputToWei, stringWeiToBN } from '~/utils/wallet'

const { getUserId } = accountSelectors
const zeroWei = stringWeiToBN('0' as StringWei)

export const useSupporterPrompt = (receiverId?: Nullable<number>) => {
  const accountUserId = useSelector(getUserId)

  // Get the top supporter
  const { data: supporters = [], isPending: isSupportersPending } =
    useSupporters({
      userId: receiverId,
      limit: 1
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

    const topSupporterAmountWei = stringWeiToBN(topSupporter.amount)
    const currentUserAmountWei = currentUserSupporter
      ? stringWeiToBN(currentUserSupporter.amount)
      : zeroWei
    const oneAudioToWeiBN = parseAudioInputToWei('1') as BNWei

    // Amount needed is (top supporter amount - current user amount + 1 AUDIO)
    return topSupporterAmountWei
      .sub(currentUserAmountWei)
      .add(oneAudioToWeiBN) as BNWei
  }, [accountUserId, receiverId, topSupporter, currentUserSupporter])

  return {
    isPending: isSupportersPending || isCurrentUserSupporterPending,
    amountToDethrone,
    isFirstSupporter
  }
}
