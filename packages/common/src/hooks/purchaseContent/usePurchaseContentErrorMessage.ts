import { BuyUSDCErrorCode } from 'store/index'
import {
  PurchaseContentErrorCode,
  PurchaseErrorCode
} from 'store/purchase-content'
import { formatPrice } from 'utils/formatUtil'

import { RemoteVarHook } from '../useRemoteVar'

import { useUSDCPurchaseConfig } from './useUSDCPurchaseConfig'

const messages = {
  generic: 'Your purchase was unsuccessful.',
  minimumPurchase: (minAmount: number) =>
    `Total purchase amount must be at least $${formatPrice(minAmount)}.`,
  maximumPurchase: (maxAmount: number) =>
    `Total purchase amount may not exceed $${formatPrice(maxAmount)}.`
}

export const usePurchaseContentErrorMessage = (
  errorCode: PurchaseContentErrorCode,
  useRemoteVar: RemoteVarHook
) => {
  const { minUSDCPurchaseAmountCents, maxUSDCPurchaseAmountCents } =
    useUSDCPurchaseConfig(useRemoteVar)

  switch (errorCode) {
    case BuyUSDCErrorCode.MinAmountNotMet:
      return messages.minimumPurchase(minUSDCPurchaseAmountCents)
    case BuyUSDCErrorCode.MaxAmountExceeded:
      return messages.maximumPurchase(maxUSDCPurchaseAmountCents)
    case BuyUSDCErrorCode.OnrampError:
    case PurchaseErrorCode.Unknown:
      return messages.generic
  }
}
