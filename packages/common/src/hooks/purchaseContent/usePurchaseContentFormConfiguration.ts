import { useCallback } from 'react'

import { USDC } from '@audius/fixed-decimal'
import BN from 'bn.js'
import { useDispatch, useSelector } from 'react-redux'

import { PurchaseMethod } from 'models/PurchaseContent'
import { UserTrackMetadata } from 'models/Track'
import {
  ContentType,
  isContentPurchaseInProgress,
  purchaseContentActions,
  purchaseContentSelectors
} from 'store/purchase-content'
import { useUSDCManualTransferModal } from 'store/ui'
import { Nullable } from 'utils/typeUtils'

import { useUSDCBalance } from '../useUSDCBalance'

import {
  AMOUNT_PRESET,
  CENTS_TO_USDC_MULTIPLIER,
  CUSTOM_AMOUNT,
  PURCHASE_METHOD
} from './constants'
import { PayExtraAmountPresetValues, PayExtraPreset } from './types'
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
  price: number
  presetValues: PayExtraAmountPresetValues
}) => {
  const dispatch = useDispatch()
  const { onOpen: openUsdcManualTransferModal } = useUSDCManualTransferModal()
  const stage = useSelector(getPurchaseContentFlowStage)
  const error = useSelector(getPurchaseContentError)
  const isUnlocking = !error && isContentPurchaseInProgress(stage)
  const { data: balanceBN } = useUSDCBalance()
  const balance = USDC((balanceBN ?? new BN(0)) as BN).value
  const initialValues: PurchaseContentValues = {
    [CUSTOM_AMOUNT]: undefined,
    [AMOUNT_PRESET]: PayExtraPreset.NONE,
    [PURCHASE_METHOD]:
      balance >= BigInt(price * CENTS_TO_USDC_MULTIPLIER)
        ? PurchaseMethod.BALANCE
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
      const startPurchaseAction = startPurchaseContentFlow({
        purchaseMethod,
        extraAmount,
        extraAmountPreset: amountPreset,
        contentId: track.track_id,
        contentType: ContentType.TRACK
      })

      if (purchaseMethod === PurchaseMethod.CRYPTO) {
        openUsdcManualTransferModal({
          isOpen: true,
          source: 'purchase',
          amount: price + extraAmount,
          onSuccessAction: startPurchaseAction
        })
      } else {
        dispatch(startPurchaseAction)
      }
    },
    [
      isUnlocking,
      track,
      presetValues,
      dispatch,
      openUsdcManualTransferModal,
      price
    ]
  )

  return {
    initialValues,
    validationSchema: PurchaseContentSchema,
    onSubmit
  }
}
