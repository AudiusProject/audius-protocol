import { useEffect } from 'react'

import {
  purchaseContentSelectors,
  isContentPurchaseInProgress,
  useUSDCBalance
} from '@audius/common'
import { useSelector } from 'react-redux'

import { usePurchaseSummaryValues } from './usePurchaseSummaryValues'

const { getPurchaseContentFlowStage, getPurchaseContentError } =
  purchaseContentSelectors

export const usePurchaseContentFormState = ({ price }: { price: number }) => {
  const stage = useSelector(getPurchaseContentFlowStage)
  const error = useSelector(getPurchaseContentError)
  const isUnlocking = !error && isContentPurchaseInProgress(stage)

  const {
    data: currentBalance,
    recoveryStatus,
    refresh,
    cancelPolling
  } = useUSDCBalance()

  // Refresh balance on successful recovery
  useEffect(() => {
    if (recoveryStatus === 'success') {
      refresh()
    }
  }, [recoveryStatus, refresh])

  const purchaseSummaryValues = usePurchaseSummaryValues({
    price,
    currentBalance
  })

  useEffect(() => {
    if (isUnlocking) {
      cancelPolling()
    }
  }, [isUnlocking, cancelPolling])

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
