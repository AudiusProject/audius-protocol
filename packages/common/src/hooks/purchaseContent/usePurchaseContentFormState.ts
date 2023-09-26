import { useCallback } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import { UserTrackMetadata } from 'models/Track'
import {
  ContentType,
  isContentPurchaseInProgress,
  purchaseContentActions,
  purchaseContentSelectors
} from 'store/purchase-content'

import { AMOUNT_PRESET, CUSTOM_AMOUNT } from './constants'
import { PayExtraPreset } from './types'
import { getExtraAmount } from './utils'
import { PurchaseContentValues } from './validation'

const { startPurchaseContentFlow } = purchaseContentActions
const { getPurchaseContentFlowStage, getPurchaseContentError } =
  purchaseContentSelectors

export const usePurchaseContentFormState = ({
  track
}: {
  track: UserTrackMetadata
}) => {
  const dispatch = useDispatch()
  const stage = useSelector(getPurchaseContentFlowStage)
  const error = useSelector(getPurchaseContentError)
  const isUnlocking = !error && isContentPurchaseInProgress(stage)

  const initialValues: PurchaseContentValues = {
    [CUSTOM_AMOUNT]: undefined,
    [AMOUNT_PRESET]: PayExtraPreset.NONE
  }

  const handleConfirmPurchase = useCallback(
    ({ customAmount, amountPreset }: PurchaseContentValues) => {
      if (isUnlocking) return

      const extraAmount = getExtraAmount(amountPreset, customAmount)

      dispatch(
        startPurchaseContentFlow({
          extraAmount,
          extraAmountPreset: amountPreset,
          contentId: track.track_id,
          contentType: ContentType.TRACK
        })
      )
    },
    [isUnlocking, dispatch, track.track_id]
  )

  return {
    stage,
    error,
    isUnlocking,
    initialValues,
    handleConfirmPurchase
  }
}

export type PurchaseContentFormState = ReturnType<
  typeof usePurchaseContentFormState
>
