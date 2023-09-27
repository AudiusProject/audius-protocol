import {
  UserTrackMetadata,
  getPurchaseSummaryValues,
  isPremiumContentUSDCPurchaseGated,
  useUSDCBalance
} from '@audius/common'
import { useField } from 'formik'

import {
  AMOUNT_PRESET,
  CUSTOM_AMOUNT,
  payExtraAmountPresetValues
} from './components/constants'
import { PayExtraPreset } from './components/types'

/**
 * Helper function to extract the value from the Pay Extra amount picker
 * @param amountPreset the selected preset
 * @param customAmount the custom amount entered, if applicable
 * @returns the amount as a number
 */
export const getExtraAmount = (
  amountPreset: PayExtraPreset,
  customAmount = 0
) => {
  switch (amountPreset) {
    case PayExtraPreset.LOW:
    case PayExtraPreset.MEDIUM:
    case PayExtraPreset.HIGH:
      return payExtraAmountPresetValues[amountPreset]
    case PayExtraPreset.CUSTOM:
      return Number.isFinite(customAmount) ? customAmount : 0
    default:
      return 0
  }
}

/**
 * Gets the purchase summary table values for a track.
 * Must be called inside a Formik form. Pulls in relevant form values and the user balance.
 * @param track the track with the premium condition containing the price
 * @returns the purchase summary values necessary to render the purchase summary table
 */
export const usePurchaseSummaryValues = (
  track: Pick<UserTrackMetadata, 'premium_conditions'>
) => {
  const { data: currentBalance } = useUSDCBalance()
  const [{ value: customAmount }] = useField(CUSTOM_AMOUNT)
  const [{ value: extraAmountPreset }] = useField(AMOUNT_PRESET)

  if (!isPremiumContentUSDCPurchaseGated(track.premium_conditions)) {
    return null
  }

  const price = track.premium_conditions.usdc_purchase.price
  const extraAmount = getExtraAmount(extraAmountPreset, customAmount)
  const purchaseSummaryValues = getPurchaseSummaryValues({
    // Passing undefined for the None case so that the row doesn't render.
    // In other cases, the user may have input 0 and we want to show the row
    // to reflect that until they explicitly select no preset
    extraAmount:
      extraAmountPreset === PayExtraPreset.NONE ? undefined : extraAmount,
    price,
    currentBalance
  })

  return purchaseSummaryValues
}
