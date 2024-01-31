import BN from 'bn.js'

import { BNUSDC } from '~/models/Wallet'
import { Nullable } from '~/utils/typeUtils'
import { BN_USDC_CENT_WEI, ceilingBNUSDCToNearestCent } from '~/utils/wallet'

import { PurchaseContentStage } from './types'

export const zeroBalance = () => new BN(0) as BNUSDC

export const isContentPurchaseInProgress = (stage: PurchaseContentStage) => {
  return [
    PurchaseContentStage.START,
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
  /** Total price for display on the Buy button */
  totalPrice: number
}

type GetPurchaseSummaryValuesArgs = {
  price: number
  currentBalance: Nullable<BNUSDC>
  minPurchaseAmountCents: number
  extraAmount?: number
}

/**
 * Gets values for a purchase summary. Will ignore existing balance if applying
 * it would cause the transaction to fall below the given minimum purchase amount.
 *  - amountDue
 *  - existingBalance
 *  - basePrice
 *  - extraAmount
 * Throws if number bounds are exceeded
 */
export const getPurchaseSummaryValues = ({
  price,
  currentBalance,
  extraAmount,
  minPurchaseAmountCents
}: GetPurchaseSummaryValuesArgs): PurchaseSummaryValues => {
  let amountDue = price + (extraAmount ?? 0)
  let existingBalance
  const balanceBN =
    currentBalance && currentBalance.gt(BN_USDC_CENT_WEI)
      ? currentBalance
      : zeroBalance()
  const amountDueBN = new BN(amountDue.toString()).mul(BN_USDC_CENT_WEI)

  if (balanceBN.gte(amountDueBN)) {
    existingBalance = amountDue
    amountDue = 0
  } else {
    // Note: Rounding amount due *up* to nearest cent for cases where the balance
    // is between cents so that we aren't advertising *lower* than what the user
    // will have to pay.
    const diff = ceilingBNUSDCToNearestCent(
      amountDueBN.sub(balanceBN) as BNUSDC
    )
      .div(BN_USDC_CENT_WEI)
      .toNumber()
    // Don't allow use of existing balance if final amount due is less than the minumum purchase amount
    if (diff > 0 && diff >= minPurchaseAmountCents) {
      amountDue = diff
      existingBalance = balanceBN.div(BN_USDC_CENT_WEI).toNumber()
    }
  }

  return {
    amountDue,
    existingBalance,
    basePrice: price,
    extraAmount,
    totalPrice: price + (extraAmount ?? 0)
  }
}

/** Used by sagas to calculate balance needed to complete a USDC transaction. Enforces the given minimum purchase amount and will ignore existing balance if applying it would cause the transaction to fall below that amount. */
export function getBalanceNeeded(
  totalAmountDue: BNUSDC,
  existingBalance: BNUSDC,
  minPurchaseAmountCents: number
) {
  const diff = totalAmountDue.sub(existingBalance)
  const minPurchaseAmountBN = new BN(minPurchaseAmountCents).mul(
    BN_USDC_CENT_WEI
  ) as BNUSDC
  if (diff.gte(minPurchaseAmountBN)) {
    return diff as BNUSDC
  } else if (diff.gtn(0)) {
    return totalAmountDue
  }
  return new BN(0) as BNUSDC
}
