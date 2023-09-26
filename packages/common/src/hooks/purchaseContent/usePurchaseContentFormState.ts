import { useSelector } from 'react-redux'

import { useUSDCBalance } from 'hooks/useUSDCBalance'
import {
  isContentPurchaseInProgress,
  purchaseContentSelectors
} from 'store/purchase-content'

import { PurchasableTrackMetadata } from './types'
import { usePurchaseSummaryValues } from './usePurchaseSummaryValues'

const { getPurchaseContentFlowStage, getPurchaseContentError } =
  purchaseContentSelectors

export const usePurchaseContentFormState = ({
  track
}: {
  track: PurchasableTrackMetadata
}) => {
  const {
    premium_conditions: {
      usdc_purchase: { price }
    }
  } = track
  const stage = useSelector(getPurchaseContentFlowStage)
  const error = useSelector(getPurchaseContentError)
  const isUnlocking = !error && isContentPurchaseInProgress(stage)

  const { data: currentBalance } = useUSDCBalance()

  const purchaseSummaryValues = usePurchaseSummaryValues({
    price,
    currentBalance
  })

  return {
    track,
    stage,
    error,
    isUnlocking,
    purchaseSummaryValues
  }
}

export type PurchaseContentFormState = ReturnType<
  typeof usePurchaseContentFormState
>
