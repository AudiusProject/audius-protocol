import { useEffect } from 'react'

import {
  purchaseContentSelectors,
  isContentPurchaseInProgress,
  useUSDCBalance,
  Status
} from '@audius/common'
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

  const { data: currentBalance, recoveryStatus, refresh } = useUSDCBalance()

  // Refresh balance on successful recovery
  useEffect(() => {
    if (recoveryStatus === Status.SUCCESS) {
      refresh()
    }
  }, [recoveryStatus, refresh])

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
