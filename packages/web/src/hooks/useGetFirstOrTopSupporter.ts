import { useEffect, useState } from 'react'

import {
  ID,
  Supporter,
  User,
  BNWei,
  StringAudio,
  StringWei,
  Nullable
} from '@audius/common'

import { SupportersMap, SupportingMap } from 'common/store/tipping/types'
import { parseWeiNumber } from 'common/utils/formatUtil'
import { parseAudioInputToWei, stringWeiToBN } from 'common/utils/wallet'

const zeroWei = stringWeiToBN('0' as StringWei)

const parseToBNWei = (tipAmount: StringAudio) => {
  if (!tipAmount) return zeroWei
  return parseAudioInputToWei(tipAmount) as BNWei
}

type UseGetSupportProps = {
  tipAmount: string
  accountBalance: BNWei
  account: Nullable<User>
  receiver: Nullable<User>
  supportingMap: SupportingMap
  supportersMap: SupportersMap
}

export const useGetFirstOrTopSupporter = ({
  tipAmount,
  accountBalance,
  account,
  receiver,
  supportingMap,
  supportersMap
}: UseGetSupportProps) => {
  const [amountToTipToBecomeTopSupporter, setAmountToTipToBecomeTopSupporter] =
    useState<Nullable<BNWei>>(null)
  const [supportingAmount, setSupportingAmount] =
    useState<Nullable<StringWei>>(null)
  const [shouldFetchUserSupporter, setShouldFetchUserSupporter] =
    useState(false)
  const [topSupporter, setTopSupporter] = useState<Nullable<Supporter>>(null)
  const [isFirstSupporter, setIsFirstSupporter] = useState(false)
  const tipAmountWei = parseToBNWei(tipAmount)
  const hasInsufficientBalance = tipAmountWei.gt(accountBalance)

  /**
   * Get supporting info if current user is already supporting receiver
   * so that the already supported amount can be used to determine
   * how much is left to tip to become top supporter
   */
  useEffect(() => {
    if (!account || !receiver) return
    if (supportingAmount) return

    const supportingForAccount = supportingMap[account.user_id] ?? null
    const accountSupportingReceiver =
      supportingForAccount?.[receiver.user_id] ?? null
    if (accountSupportingReceiver) {
      setSupportingAmount(accountSupportingReceiver.amount)
    } else {
      setShouldFetchUserSupporter(true)
    }
  }, [account, receiver, supportingAmount, supportingMap])

  /**
   * Get user who is top supporter to later check whether it is
   * not the same as the current user
   */
  useEffect(() => {
    if (!receiver) return

    const supportersForReceiver = supportersMap[receiver.user_id] ?? {}
    const rankedSupportersList = (
      Object.keys(supportersForReceiver) as unknown as ID[]
    )
      .sort(
        (k1, k2) =>
          supportersForReceiver[k1].rank - supportersForReceiver[k2].rank
      )
      .map((k) => supportersForReceiver[k])
    const theTopSupporter =
      rankedSupportersList.length > 0 ? rankedSupportersList[0] : null

    if (theTopSupporter) {
      setIsFirstSupporter(false)
      setTopSupporter(theTopSupporter)
    } else {
      setIsFirstSupporter(true)
    }
  }, [receiver, supportersMap])

  /**
   * Check whether or not to display prompt to become top or first supporter
   */
  useEffect(() => {
    if (hasInsufficientBalance || !account || !topSupporter) return

    const isAlreadyTopSupporter = account.user_id === topSupporter.sender_id
    if (isAlreadyTopSupporter) return

    const topSupporterAmountWei = stringWeiToBN(topSupporter.amount)
    const oneAudioToWeiBN = parseWeiNumber('1') as BNWei
    let newAmountToTipToBecomeTopSupporter = topSupporterAmountWei.add(
      oneAudioToWeiBN
    ) as BNWei
    if (supportingAmount) {
      const supportingAmountWei = stringWeiToBN(supportingAmount)
      newAmountToTipToBecomeTopSupporter =
        newAmountToTipToBecomeTopSupporter.sub(supportingAmountWei) as BNWei
    }
    if (
      accountBalance.gte(newAmountToTipToBecomeTopSupporter) &&
      newAmountToTipToBecomeTopSupporter.gte(oneAudioToWeiBN)
    ) {
      setAmountToTipToBecomeTopSupporter(newAmountToTipToBecomeTopSupporter)
    }
  }, [
    hasInsufficientBalance,
    account,
    topSupporter,
    supportingAmount,
    accountBalance
  ])

  return {
    amountToTipToBecomeTopSupporter,
    shouldFetchUserSupporter,
    isFirstSupporter,
    tipAmountWei,
    hasInsufficientBalance
  }
}
