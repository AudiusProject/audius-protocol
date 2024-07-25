import { useCallback } from 'react'

import { USDC } from '@audius/fixed-decimal'
import BN from 'bn.js'
import { useDispatch, useSelector } from 'react-redux'
import { put, call } from 'typed-redux-saga'

import { Kind, UserCollectionMetadata } from '~/models'
import { PurchaseMethod, PurchaseVendor } from '~/models/PurchaseContent'
import { UserTrackMetadata } from '~/models/Track'
import { cacheActions, getContext, accountActions } from '~/store'
import { fetchAccountSucceeded, signedIn } from '~/store/account/slice'
import {
  PurchaseableContentType,
  PurchaseContentPage,
  isContentPurchaseInProgress,
  purchaseContentActions,
  purchaseContentSelectors
} from '~/store/purchase-content'
import { isContentCollection, isContentTrack } from '~/utils'
import { Nullable } from '~/utils/typeUtils'

import { useUSDCBalance } from '../useUSDCBalance'

import {
  AMOUNT_PRESET,
  CENTS_TO_USDC_MULTIPLIER,
  CUSTOM_AMOUNT,
  PURCHASE_METHOD,
  PURCHASE_VENDOR
} from './constants'
import { PayExtraAmountPresetValues, PayExtraPreset } from './types'
import { getExtraAmount } from './utils'
import { PurchaseContentSchema, PurchaseContentValues } from './validation'

const { startPurchaseContentFlow, setPurchasePage } = purchaseContentActions
const {
  getPurchaseContentFlowStage,
  getPurchaseContentError,
  getPurchaseContentPage
} = purchaseContentSelectors

export function* fetchAccountAsync({ isSignUp = false }) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')

  yield* put(accountActions.fetchAccountRequested())

  const account = yield* call(audiusBackendInstance.getAccount)
  console.log('asdf account: ', account)
  if (account) {
    account.handle = 'guest'
  }

  // Set the userId in the remoteConfigInstance
  remoteConfigInstance.setUserId(account.user_id)

  // yield call(recordIPIfNotRecent, account.handle)

  // Cache the account and put the signedIn action. We're done.
  yield call(cacheAccount, account)
  yield put(signedIn({ account, isSignUp }))
}

function* cacheAccount(account) {
  const localStorage = yield* getContext('localStorage')
  const collections = account.playlists || []

  yield put(
    cacheActions.add(Kind.USERS, [
      { id: account.user_id, uid: 'USER_ACCOUNT', metadata: account }
    ])
  )

  const formattedAccount = {
    userId: account.user_id,
    collections
  }

  yield call([localStorage, 'setAudiusAccount'], formattedAccount)
  yield call([localStorage, 'setAudiusAccountUser'], account)

  yield put(fetchAccountSucceeded(formattedAccount))
}

export const usePurchaseContentFormConfiguration = ({
  metadata,
  price,
  presetValues,
  purchaseVendor
}: {
  metadata?: Nullable<UserTrackMetadata | UserCollectionMetadata>
  price: number
  presetValues: PayExtraAmountPresetValues
  purchaseVendor?: PurchaseVendor
}) => {
  const dispatch = useDispatch()
  const isAlbum = isContentCollection(metadata)
  const isTrack = isContentTrack(metadata)
  const stage = useSelector(getPurchaseContentFlowStage)
  const error = useSelector(getPurchaseContentError)
  const page = useSelector(getPurchaseContentPage)
  const isUnlocking = !error && isContentPurchaseInProgress(stage)
  const { data: balanceBN } = useUSDCBalance()
  const balance = USDC(balanceBN ?? new BN(0)).value

  const initialValues: PurchaseContentValues = {
    [CUSTOM_AMOUNT]: undefined,
    [AMOUNT_PRESET]: PayExtraPreset.NONE,
    [PURCHASE_METHOD]:
      balance >= BigInt(price * CENTS_TO_USDC_MULTIPLIER)
        ? PurchaseMethod.BALANCE
        : PurchaseMethod.CARD,
    [PURCHASE_VENDOR]: purchaseVendor ?? PurchaseVendor.STRIPE
  }

  const onSubmit = useCallback(
    ({
      customAmount,
      amountPreset,
      purchaseMethod,
      purchaseVendor
    }: PurchaseContentValues) => {
      const contentId = isAlbum
        ? metadata.playlist_id
        : isTrack
        ? metadata.track_id
        : undefined
      if (isUnlocking || !contentId) return

      if (
        purchaseMethod === PurchaseMethod.CRYPTO &&
        page === PurchaseContentPage.PURCHASE
      ) {
        dispatch(setPurchasePage({ page: PurchaseContentPage.TRANSFER }))
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
            extraAmount,
            extraAmountPreset: amountPreset,
            contentId,
            contentType: isAlbum
              ? PurchaseableContentType.ALBUM
              : PurchaseableContentType.TRACK
          })
        )
      }
    },
    [isAlbum, isUnlocking, metadata, page, presetValues, dispatch, isTrack]
  )

  return {
    initialValues,
    validationSchema: PurchaseContentSchema,
    onSubmit
  }
}
