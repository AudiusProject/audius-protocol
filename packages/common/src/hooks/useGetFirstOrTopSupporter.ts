import { useEffect, useState } from 'react'

import { SupportersMap, SupportingMap } from '~/store/tipping'
import { parseWeiNumber } from '~/utils/formatUtil'
import { Nullable } from '~/utils/typeUtils'
import { parseAudioInputToWei, stringWeiToBN } from '~/utils/wallet'

import { ID, Supporter, User, BNWei, StringAudio, StringWei } from '../models'

const zeroWei = stringWeiToBN('0' as StringWei)

const parseToBNWei = (tipAmount: StringAudio) => {
  if (!tipAmount) return zeroWei
  return parseAudioInputToWei(tipAmount) as BNWei
}

type UseGetSupportProps = {
  tipAmount: string
  accountBalance: BNWei
  accountUserId: Nullable<ID>
  receiver: Nullable<User>
  supportingMap: SupportingMap
  supportersMap: SupportersMap
}

export const useGetFirstOrTopSupporter = ({
  tipAmount,
  accountBalance,
  accountUserId,
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
  const [
    shouldFetchSupportersForReceiver,
    setShouldFetchSupportersForReceiver
  ] = useState(false)
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
    if (!accountUserId || !receiver) return
    if (supportingAmount) return

    const supportingForAccount = supportingMap[accountUserId] ?? null
    const accountSupportingReceiver =
      supportingForAccount?.[receiver.user_id] ?? null
    if (accountSupportingReceiver) {
      setSupportingAmount(accountSupportingReceiver.amount)
    } else {
      setShouldFetchUserSupporter(true)
    }
  }, [accountUserId, receiver, supportingAmount, supportingMap])

  /**
   * Get user who is top supporter to later check whether it is
   * not the same as the current user
   */
  useEffect(() => {
    if (!receiver) return

    const supportersForReceiver = supportersMap[receiver.user_id]

    // It's possible that the receiver's supporters have not yet
    // been fetched, in this case we prompt to fetch that data.
    // E.g. for a user whose top supporter changed, clicking on
    // the dethroned notification will go to the send tip modal/drawer
    // but that user's supporters may not have been fetched yet.
    if (!supportersForReceiver) {
      setShouldFetchSupportersForReceiver(true)
      return
    }

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
    if (hasInsufficientBalance || !accountUserId || !topSupporter) return

    const isAlreadyTopSupporter = accountUserId === topSupporter.sender_id
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
    accountUserId,
    topSupporter,
    supportingAmount,
    accountBalance
  ])

  return {
    amountToTipToBecomeTopSupporter,
    shouldFetchUserSupporter,
    shouldFetchSupportersForReceiver,
    isFirstSupporter,
    tipAmountWei,
    hasInsufficientBalance
  }
}
