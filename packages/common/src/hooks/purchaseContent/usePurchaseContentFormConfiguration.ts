import { useCallback } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import { UserTrackMetadata } from 'models/Track'
import {
  ContentType,
  isContentPurchaseInProgress,
  purchaseContentActions,
  purchaseContentSelectors
} from 'store/purchase-content'
import { Nullable } from 'utils/typeUtils'

import { AMOUNT_PRESET, CUSTOM_AMOUNT } from './constants'
import { PayExtraPreset } from './types'
import { getExtraAmount } from './utils'
import { PurchaseContentSchema, PurchaseContentValues } from './validation'

const { startPurchaseContentFlow } = purchaseContentActions
const { getPurchaseContentFlowStage, getPurchaseContentError } =
  purchaseContentSelectors

const initialValues: PurchaseContentValues = {
  [CUSTOM_AMOUNT]: undefined,
  [AMOUNT_PRESET]: PayExtraPreset.NONE
}

export const usePurchaseContentFormConfiguration = ({
  track
}: {
  track?: Nullable<UserTrackMetadata>
}) => {
  const dispatch = useDispatch()
  const stage = useSelector(getPurchaseContentFlowStage)
  const error = useSelector(getPurchaseContentError)
  const isUnlocking = !error && isContentPurchaseInProgress(stage)

  const onSubmit = useCallback(
    ({ customAmount, amountPreset }: PurchaseContentValues) => {
      if (isUnlocking || !track?.track_id) return

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
    [isUnlocking, dispatch, track?.track_id]
  )

  return {
    initialValues,
    validationSchema: PurchaseContentSchema,
    onSubmit
  }
}
