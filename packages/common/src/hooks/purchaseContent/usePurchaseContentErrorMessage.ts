import { USDC } from '@audius/fixed-decimal'

import { BuyUSDCErrorCode } from '~/store/index'
import {
  PurchaseContentErrorCode,
  PurchaseErrorCode
} from '~/store/purchase-content'

import { useUSDCPurchaseConfig } from './useUSDCPurchaseConfig'

const messages = {
  generic: 'Your purchase was unsuccessful.',
  noQuote: 'Unable to get quote',
  insufficientExternalTokenBalance: 'Insufficient token balance.',
  minimumPurchase: (minAmount: number) =>
    `Total purchase amount must be at least $${USDC(minAmount / 100).toLocaleString()}.`,
  maximumPurchase: (maxAmount: number) =>
    `Total purchase amount may not exceed $${USDC(maxAmount / 100).toLocaleString()}.`,
  badAmount: (minAmount: number, maxAmount: number) =>
    `Total purchase amount must be between $${USDC(
      minAmount / 100
    ).toLocaleString()} and ${USDC(maxAmount / 100).toLocaleString()}`,
  countryNotSupported:
    'Stripe is unable to support transactions in this country'
}

export const usePurchaseContentErrorMessage = (
  errorCode: PurchaseContentErrorCode
) => {
  const { minUSDCPurchaseAmountCents, maxUSDCPurchaseAmountCents } =
    useUSDCPurchaseConfig()

  switch (errorCode) {
    case BuyUSDCErrorCode.MinAmountNotMet:
      return messages.minimumPurchase(minUSDCPurchaseAmountCents)
    case BuyUSDCErrorCode.MaxAmountExceeded:
      return messages.maximumPurchase(maxUSDCPurchaseAmountCents)
    case PurchaseErrorCode.InsufficientExternalTokenBalance:
      return messages.insufficientExternalTokenBalance
    case PurchaseErrorCode.NoQuote:
      return messages.noQuote
    case BuyUSDCErrorCode.OnrampError:
    case BuyUSDCErrorCode.CountryNotSupported:
    case PurchaseErrorCode.Canceled:
    case PurchaseErrorCode.InsufficientBalance:
    case PurchaseErrorCode.Unknown:
      return messages.generic
  }
}
