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
  amountDue: number
  existingBalance: number | undefined
  basePrice: number
  artistCut: number
}

export const getPurchaseSummaryValues = (
  price: number,
  currentBalance: Nullable<BNUSDC>
): PurchaseSummaryValues => {
  let amountDue = price
  let existingBalance
  const priceBN = new BN(price).mul(BN_USDC_CENT_WEI)
  const balance = currentBalance ?? zeroBalance()

  if (balance.gte(priceBN)) {
    amountDue = 0
    existingBalance = price
  }
  // Only count the balance if it's greater than 1 cent
  else if (balance.gt(BN_USDC_CENT_WEI)) {
    // Note: Rounding amount due *up* to nearest cent for cases where the balance
    // is between cents so that we aren't advertising *lower* than what the user
    // will have to pay.
    const diff = priceBN.sub(balance)
    amountDue = ceilingBNUSDCToNearestCent(diff as BNUSDC)
      .div(BN_USDC_CENT_WEI)
      .toNumber()
    existingBalance = price - amountDue
  }

  return { amountDue, existingBalance, basePrice: price, artistCut: price }
}
