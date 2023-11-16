import { useCallback } from 'react'

import { USDC } from '@audius/fixed-decimal'
import { useDispatch, useSelector } from 'react-redux'

import { UserTrackMetadata } from 'models/Track'
import {
  ContentType,
  isContentPurchaseInProgress,
  purchaseContentActions,
  purchaseContentSelectors
} from 'store/purchase-content'
import { useUSDCManualTransferModal } from 'store/ui'
import { USDC_DIVISOR } from 'utils/formatUtil'
import { Nullable } from 'utils/typeUtils'

import { useUSDCBalance } from '../useUSDCBalance'

import { AMOUNT_PRESET, CUSTOM_AMOUNT, PURCHASE_METHOD } from './constants'
import {
  PayExtraAmountPresetValues,
  PayExtraPreset,
  PurchaseMethod
} from './types'
import { getExtraAmount } from './utils'
import { PurchaseContentSchema, PurchaseContentValues } from './validation'

const { startPurchaseContentFlow } = purchaseContentActions
const { getPurchaseContentFlowStage, getPurchaseContentError } =
  purchaseContentSelectors

export const usePurchaseContentFormConfiguration = ({
  track,
  price,
  presetValues
}: {
  track?: Nullable<UserTrackMetadata>
  price: bigint
  presetValues: PayExtraAmountPresetValues
}) => {
  const dispatch = useDispatch()
  const { onOpen: openUsdcManualTransferModal } = useUSDCManualTransferModal()
  const stage = useSelector(getPurchaseContentFlowStage)
  const error = useSelector(getPurchaseContentError)
  const isUnlocking = !error && isContentPurchaseInProgress(stage)
  const { data: balanceBN } = useUSDCBalance()
  const balance = USDC(balanceBN?.div(USDC_DIVISOR).toString() ?? 0)
  const initialValues: PurchaseContentValues = {
    [CUSTOM_AMOUNT]: undefined,
    [AMOUNT_PRESET]: PayExtraPreset.NONE,
    [PURCHASE_METHOD]:
      balance.value >= price
        ? PurchaseMethod.EXISTING_BALANCE
        : PurchaseMethod.CARD
  }

  const onSubmit = useCallback(
    ({ customAmount, amountPreset, purchaseMethod }: PurchaseContentValues) => {
      if (isUnlocking || !track?.track_id) return

      const extraAmount = getExtraAmount({
        amountPreset,
        presetValues,
        customAmount
      })

      if (purchaseMethod === PurchaseMethod.CARD) {
        if (track?.track_id === 0) {
          dispatch(
            startPurchaseContentFlow({
              extraAmount,
              extraAmountPreset: amountPreset,
              contentId: track.track_id,
              contentType: ContentType.TRACK
            })
          )
        }
      } else if (purchaseMethod === PurchaseMethod.EXISTING_BALANCE) {
        if (track?.track_id === 0) {
          dispatch(
            startPurchaseContentFlow({
              extraAmount,
              extraAmountPreset: amountPreset,
              contentId: track.track_id,
              contentType: ContentType.TRACK
            })
          )
        }
      } else if (purchaseMethod === PurchaseMethod.MANUAL_TRANSFER) {
        openUsdcManualTransferModal()
      }
    },
    [isUnlocking, track, presetValues, dispatch, openUsdcManualTransferModal]
  )

  return {
    initialValues,
    validationSchema: PurchaseContentSchema,
    onSubmit
  }
}
