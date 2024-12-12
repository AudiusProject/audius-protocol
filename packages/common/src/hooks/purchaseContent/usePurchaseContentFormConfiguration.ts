import { useCallback, useEffect, useMemo } from 'react'

import { USDC } from '@audius/fixed-decimal'
import BN from 'bn.js'
import { useDispatch, useSelector } from 'react-redux'
import { useLocalStorage } from 'react-use'
import { z } from 'zod'

import { useGetCurrentUser } from '~/api'
import { useAudiusQueryContext } from '~/audius-query/AudiusQueryContext'
import { UserCollectionMetadata } from '~/models'
import { PurchaseMethod, PurchaseVendor } from '~/models/PurchaseContent'
import { UserTrackMetadata } from '~/models/Track'
import { FeatureFlags } from '~/services'
import {
  PurchaseableContentType,
  PurchaseContentPage,
  isContentPurchaseInProgress,
  purchaseContentActions,
  purchaseContentSelectors
} from '~/store/purchase-content'
import { isContentCollection, isContentTrack } from '~/utils'

import { useFeatureFlag } from '../useFeatureFlag'
import { useUSDCBalance } from '../useUSDCBalance'

import {
  AMOUNT_PRESET,
  CENTS_TO_USDC_MULTIPLIER,
  CUSTOM_AMOUNT,
  GUEST_CHECKOUT,
  GUEST_EMAIL,
  PURCHASE_METHOD,
  PURCHASE_METHOD_MINT_ADDRESS,
  PURCHASE_VENDOR
} from './constants'
import { PayExtraAmountPresetValues, PayExtraPreset } from './types'
import { getExtraAmount } from './utils'
import { createPurchaseContentSchema } from './validation'

const { startPurchaseContentFlow, setPurchasePage } = purchaseContentActions
const {
  getPurchaseContentFlowStage,
  getPurchaseContentError,
  getPurchaseContentPage
} = purchaseContentSelectors

const USDC_TOKEN_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

export const usePurchaseContentFormConfiguration = ({
  metadata,
  price,
  presetValues,
  purchaseVendor
}: {
  metadata?: UserTrackMetadata | UserCollectionMetadata
  price: number
  presetValues: PayExtraAmountPresetValues
  purchaseVendor?: PurchaseVendor
}) => {
  const audiusQueryContext = useAudiusQueryContext()

  const dispatch = useDispatch()
  const isAlbum = isContentCollection(metadata)
  const isTrack = isContentTrack(metadata)
  const stage = useSelector(getPurchaseContentFlowStage)
  const error = useSelector(getPurchaseContentError)
  const page = useSelector(getPurchaseContentPage)
  const isUnlocking = !error && isContentPurchaseInProgress(stage)
  const { data: balanceBN } = useUSDCBalance()
  const balance = USDC(balanceBN ?? new BN(0)).value
  const [guestEmail, setGuestEmail] = useLocalStorage(GUEST_EMAIL, '')
  const { data: currentUser } = useGetCurrentUser({})
  const featureFlag = useFeatureFlag(FeatureFlags.GUEST_CHECKOUT)
  const guestCheckoutEnabled = featureFlag.isEnabled
  console.log('asdf isGuestCheckout', guestCheckoutEnabled)

  const isGuestCheckout =
    guestCheckoutEnabled &&
    (!currentUser || (currentUser && !currentUser.handle))

  useEffect(() => {
    if (isGuestCheckout) {
      dispatch(setPurchasePage({ page: PurchaseContentPage.GUEST_CHECKOUT }))
    }
  }, [dispatch, isGuestCheckout])

  const initialValues: PurchaseContentValues = {
    [CUSTOM_AMOUNT]: undefined,
    [AMOUNT_PRESET]: PayExtraPreset.NONE,
    [PURCHASE_METHOD]:
      balance >= BigInt(price * CENTS_TO_USDC_MULTIPLIER)
        ? PurchaseMethod.BALANCE
        : PurchaseMethod.CARD,
    [PURCHASE_VENDOR]: purchaseVendor ?? PurchaseVendor.STRIPE,
    [GUEST_CHECKOUT]: isGuestCheckout,
    [GUEST_EMAIL]: guestEmail,
    [PURCHASE_METHOD_MINT_ADDRESS]: USDC_TOKEN_ADDRESS
  }

  const contentId = isAlbum
    ? metadata?.playlist_id
    : isTrack
    ? metadata?.track_id
    : undefined

  const validationSchema = useMemo(
    () => createPurchaseContentSchema(audiusQueryContext, page),
    [audiusQueryContext, page]
  )
  type PurchaseContentValues = z.input<typeof validationSchema>

  const onSubmit = useCallback(
    ({
      customAmount,
      amountPreset,
      purchaseMethod,
      purchaseVendor,
      guestEmail,
      purchaseMethodMintAddress
    }: PurchaseContentValues) => {
      if (isUnlocking || !contentId) return

      setGuestEmail(guestEmail)

      if (
        purchaseMethod === PurchaseMethod.CRYPTO &&
        page === PurchaseContentPage.PURCHASE
      ) {
        dispatch(setPurchasePage({ page: PurchaseContentPage.TRANSFER }))
      } else if (
        page === PurchaseContentPage.GUEST_CHECKOUT &&
        guestEmail !== ''
      ) {
        dispatch(setPurchasePage({ page: PurchaseContentPage.PURCHASE }))
      } else {
        const extraAmount = getExtraAmount({
          amountPreset,
          presetValues,
          customAmount
        })
        dispatch(
          startPurchaseContentFlow({
            purchaseMethod,
            purchaseVendor,
            purchaseMethodMintAddress,
            extraAmount,
            extraAmountPreset: amountPreset,
            contentId,
            contentType: isAlbum
              ? PurchaseableContentType.ALBUM
              : PurchaseableContentType.TRACK,
            guestEmail
          })
        )
      }
    },
    [
      isUnlocking,
      contentId,
      setGuestEmail,
      page,
      dispatch,
      presetValues,
      isAlbum
    ]
  )

  return {
    initialValues,
    validationSchema,
    onSubmit
  }
}
