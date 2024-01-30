import {
  purchaseContentSelectors,
  isContentPurchaseInProgress
} from '@audius/common'
import { useUSDCBalance } from '@audius/common/hooks'
import { useSelector } from 'react-redux'

import { usePurchaseSummaryValues } from './usePurchaseSummaryValues'

const {
  getPurchaseContentFlowStage,
  getPurchaseContentError,
  getPurchaseContentPage
} = purchaseContentSelectors

export const usePurchaseContentFormState = ({ price }: { price: number }) => {
  const page = useSelector(getPurchaseContentPage)
  const stage = useSelector(getPurchaseContentFlowStage)
  const error = useSelector(getPurchaseContentError)
  const isUnlocking = !error && isContentPurchaseInProgress(stage)

  const { data: currentBalance } = useUSDCBalance()

  const purchaseSummaryValues = usePurchaseSummaryValues({
    price,
    currentBalance
  })

  return {
    page,
    stage,
    error,
    isUnlocking,
    purchaseSummaryValues
  }
}

export type PurchaseContentFormState = ReturnType<
  typeof usePurchaseContentFormState
>
