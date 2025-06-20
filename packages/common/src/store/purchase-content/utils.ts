import { UsdcWei } from '@audius/fixed-decimal'

import { Nullable } from '~/utils/typeUtils'

import { PurchaseContentStage } from './types'

export const zeroBalance = () => BigInt(0) as UsdcWei

// USDC has 6 decimals, so 1 cent = 10^4 wei
const USDC_CENT_WEI = BigInt(10000) as UsdcWei

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
  currentBalance: Nullable<UsdcWei>
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
  const balanceWei =
    currentBalance && currentBalance > USDC_CENT_WEI
      ? currentBalance
      : zeroBalance()
  const amountDueWei = (BigInt(Math.round(amountDue)) *
    USDC_CENT_WEI) as UsdcWei

  if (balanceWei >= amountDueWei) {
    existingBalance = amountDue
    amountDue = 0
  } else {
    // Note: Rounding amount due *up* to nearest cent for cases where the balance
    // is between cents so that we aren't advertising *lower* than what the user
    // will have to pay.
    const diff = amountDueWei - balanceWei
    // Ceiling to nearest cent
    const diffCents = Number((diff + USDC_CENT_WEI - BigInt(1)) / USDC_CENT_WEI)

    // Don't allow use of existing balance if final amount due is less than the minumum purchase amount
    if (diffCents > 0 && diffCents >= minPurchaseAmountCents) {
      amountDue = diffCents
      existingBalance = Number(balanceWei / USDC_CENT_WEI)
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
  totalAmountDue: UsdcWei,
  existingBalance: UsdcWei,
  minPurchaseAmountCents: number
) {
  const diff = totalAmountDue - existingBalance
  const minPurchaseAmountWei = (BigInt(minPurchaseAmountCents) *
    USDC_CENT_WEI) as UsdcWei

  if (diff >= minPurchaseAmountWei) {
    return diff as UsdcWei
  } else if (diff > BigInt(0)) {
    return totalAmountDue
  }
  return BigInt(0) as UsdcWei
}
