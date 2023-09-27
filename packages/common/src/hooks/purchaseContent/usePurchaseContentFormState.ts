import { useSelector } from 'react-redux'

import { useUSDCBalance } from 'hooks/useUSDCBalance'
import {
  isContentPurchaseInProgress,
  purchaseContentSelectors
} from 'store/purchase-content'

import { usePurchaseSummaryValues } from './usePurchaseSummaryValues'

const { getPurchaseContentFlowStage, getPurchaseContentError } =
  purchaseContentSelectors

export const usePurchaseContentFormState = ({ price }: { price: number }) => {
  const stage = useSelector(getPurchaseContentFlowStage)
  const error = useSelector(getPurchaseContentError)
  const isUnlocking = !error && isContentPurchaseInProgress(stage)

  const { data: currentBalance } = useUSDCBalance()

  const purchaseSummaryValues = usePurchaseSummaryValues({
    price,
    currentBalance
  })

  return {
    stage,
    error,
    isUnlocking,
    purchaseSummaryValues
  }
}

export type PurchaseContentFormState = ReturnType<
  typeof usePurchaseContentFormState
>
