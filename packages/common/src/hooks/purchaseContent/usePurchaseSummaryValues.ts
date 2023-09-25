import { useField } from 'formik'

import { BNUSDC } from 'models/Wallet'
import { getPurchaseSummaryValues } from 'store/purchase-content'
import { Nullable } from 'utils/typeUtils'

import { AMOUNT_PRESET, CUSTOM_AMOUNT } from './constants'
import { PayExtraPreset } from './types'
import { getExtraAmount } from './utils'

export const usePurchaseSummaryValues = ({
  price,
  currentBalance
}: {
  price: number
  currentBalance: Nullable<BNUSDC>
}) => {
  const [{ value: customAmount }] = useField(CUSTOM_AMOUNT)
  const [{ value: extraAmountPreset }] = useField(AMOUNT_PRESET)

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
