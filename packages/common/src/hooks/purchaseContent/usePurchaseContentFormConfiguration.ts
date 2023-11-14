import { useCallback } from 'react'

import BN from 'bn.js'
import { useDispatch, useSelector } from 'react-redux'

import { UserTrackMetadata } from 'models/Track'
import { BNUSDC } from 'models/Wallet'
import {
  ContentType,
  isContentPurchaseInProgress,
  purchaseContentActions,
  purchaseContentSelectors
} from 'store/purchase-content'
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
  price: number
  presetValues: PayExtraAmountPresetValues
}) => {
  const dispatch = useDispatch()
  const stage = useSelector(getPurchaseContentFlowStage)
  const error = useSelector(getPurchaseContentError)
  const isUnlocking = !error && isContentPurchaseInProgress(stage)
  const { data: balance } = useUSDCBalance()
  const balance = new USDC(balance)
  console.debug('REED balance', {
    balance: balance?.toString(),
    price,
    'balance >= price?': balance?.gte(new BN(price) as BNUSDC)
  })
  const initialValues: PurchaseContentValues = {
    [CUSTOM_AMOUNT]: undefined,
    [AMOUNT_PRESET]: PayExtraPreset.NONE,
    [PURCHASE_METHOD]: balance?.gte(new BN(price) as BNUSDC)
      ? PurchaseMethod.EXISTING_BALANCE
      : PurchaseMethod.CARD
  }

  const onSubmit = useCallback(
    ({ customAmount, amountPreset }: PurchaseContentValues) => {
      if (isUnlocking || !track?.track_id) return

      const extraAmount = getExtraAmount({
        amountPreset,
        presetValues,
        customAmount
      })

      dispatch(
        startPurchaseContentFlow({
          extraAmount,
          extraAmountPreset: amountPreset,
          contentId: track.track_id,
          contentType: ContentType.TRACK
        })
      )
    },
    [isUnlocking, presetValues, dispatch, track?.track_id]
  )

  return {
    initialValues,
    validationSchema: PurchaseContentSchema,
    onSubmit
  }
}
