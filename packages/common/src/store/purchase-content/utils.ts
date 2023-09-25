import BN from 'bn.js'

import { BNUSDC } from 'models/Wallet'
import { Nullable } from 'utils/typeUtils'
import { BN_USDC_CENT_WEI, ceilingBNUSDCToNearestCent } from 'utils/wallet'

import { PurchaseContentStage } from './types'

export const zeroBalance = () => new BN(0) as BNUSDC

export const isContentPurchaseInProgress = (stage: PurchaseContentStage) => {
  return [
    PurchaseContentStage.BUY_USDC,
    PurchaseContentStage.PURCHASING,
    PurchaseContentStage.CONFIRMING_PURCHASE
  ].includes(stage)
}

type PurchaseSummaryValues = {
  /** The final amount due to cover the purchase */
  amountDue: number
  /** The portion of the purchase being covered by existing balance */
  existingBalance: number | undefined
  /** The price of the content */
  basePrice: number
  /** The extra amount requested by the user */
  extraAmount?: number
}

type GetPurchaseSummaryValuesArgs = {
  price: number
  currentBalance: Nullable<BNUSDC>
  extraAmount?: number
}

export const getPurchaseSummaryValues = ({
  price,
  currentBalance,
  extraAmount
}: GetPurchaseSummaryValuesArgs): PurchaseSummaryValues => {
  let amountDue = price + (extraAmount ?? 0)
  let existingBalance
  const balanceBN =
    currentBalance && currentBalance.gt(BN_USDC_CENT_WEI)
      ? currentBalance
      : zeroBalance()
  const amountDueBN = new BN(amountDue).mul(BN_USDC_CENT_WEI)

  if (balanceBN.gte(amountDueBN)) {
    amountDue = 0
    existingBalance = amountDue
  } else {
    // Note: Rounding amount due *up* to nearest cent for cases where the balance
    // is between cents so that we aren't advertising *lower* than what the user
    // will have to pay.
    const diff = amountDueBN.sub(balanceBN)
    amountDue = ceilingBNUSDCToNearestCent(diff as BNUSDC)
      .div(BN_USDC_CENT_WEI)
      .toNumber()
    existingBalance = balanceBN.div(BN_USDC_CENT_WEI).toNumber()
  }

  return { amountDue, existingBalance, basePrice: price, extraAmount }
}
