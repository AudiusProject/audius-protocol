import { useCallback } from 'react'

import { USDC } from '@audius/fixed-decimal'
import BN from 'bn.js'
import { useDispatch, useSelector } from 'react-redux'
import { useLocalStorage } from 'react-use'
import { SagaIterator } from 'redux-saga'
import { call, put, select } from 'redux-saga/effects'

import { useGetCurrentUser, userApiFetchSaga } from '~/api'
import { Kind, UserCollectionMetadata, Status, User } from '~/models'
import { PurchaseMethod, PurchaseVendor } from '~/models/PurchaseContent'
import { UserTrackMetadata } from '~/models/Track'
import { FeatureFlags } from '~/services'
import {
  cacheActions,
  getContext,
  accountActions,
  accountSelectors
} from '~/store'
import {
  PurchaseableContentType,
  PurchaseContentPage,
  isContentPurchaseInProgress,
  purchaseContentActions,
  purchaseContentSelectors
} from '~/store/purchase-content'
import { isContentCollection, isContentTrack } from '~/utils'
import { Nullable } from '~/utils/typeUtils'

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
import { PurchaseContentSchema, PurchaseContentValues } from './validation'

const {
  signedIn,
  fetchAccountSucceeded,
  fetchAccountFailed,
  setWalletAddresses
} = accountActions

const { startPurchaseContentFlow, setPurchasePage } = purchaseContentActions
const {
  getPurchaseContentFlowStage,
  getPurchaseContentError,
  getPurchaseContentPage
} = purchaseContentSelectors

const USDC_TOKEN_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

export function* fetchAccountAsync({ isSignUp = false }): SagaIterator {
  const authService = yield* getContext('authService')
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')

  const accountStatus = yield select(accountSelectors.getAccountStatus)

  // Don't revert successful local account fetch
  if (accountStatus !== Status.SUCCESS) {
    yield put(accountActions.fetchAccountRequested())
  }

  yield call([
    authService.hedgehogInstance,
    authService.hedgehogInstance.refreshWallet
  ])

  const { accountWalletAddress: wallet, web3WalletAddress } = yield call([
    authService,
    authService.getWalletAddresses
  ])

  if (!wallet) {
    yield put(
      fetchAccountFailed({
        reason: 'ACCOUNT_NOT_FOUND'
      })
    )
    return
  }
  const accountData = yield call(userApiFetchSaga.getUserAccount, {
    wallet
  })

  if (!accountData || !accountData.user) {
    yield put(
      fetchAccountFailed({
        reason: 'ACCOUNT_NOT_FOUND'
      })
    )
  }
  const account = accountData.user
  yield put(
    setWalletAddresses({ currentUser: wallet, web3User: web3WalletAddress })
  )

  // Sync current user info to libs
  const libs = yield call([
    audiusBackendInstance,
    audiusBackendInstance.getAudiusLibs
  ])
  yield call([libs, libs.setCurrentUser], {
    wallet,
    userId: account.user_id
  })
  yield call(cacheAccount, account)
  yield put(signedIn({ account, isSignUp }))
}

function* cacheAccount(account: User) {
  const localStorage = yield* getContext('localStorage')

  yield put(
    cacheActions.add(Kind.USERS, [
      { id: account.user_id, uid: 'USER_ACCOUNT', metadata: account }
    ])
  )

  const formattedAccount = {
    userId: account.user_id,
    collections: [],
    orderedPlaylists: []
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
  const [guestEmail, setGuestEmail] = useLocalStorage('guest-email', '')
  const { data: currentUser } = useGetCurrentUser({})
  const { isEnabled: guestCheckoutEnabled = false } = useFeatureFlag(
    FeatureFlags.GUEST_CHECKOUT
  )

  const isGuestCheckout =
    guestCheckoutEnabled &&
    (!currentUser || (currentUser && !currentUser.handle))

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

  const onSubmit = useCallback(
    ({
      customAmount,
      amountPreset,
      purchaseMethod,
      purchaseVendor,
      guestEmail,
      purchaseMethodMintAddress
    }: PurchaseContentValues) => {
      const contentId = isAlbum
        ? metadata.playlist_id
        : isTrack
        ? metadata.track_id
        : undefined
      if (isUnlocking || !contentId) return

      setGuestEmail(guestEmail)

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
    [isAlbum, isUnlocking, metadata, page, presetValues, dispatch, isTrack]
  )

  return {
    initialValues,
    validationSchema: PurchaseContentSchema,
    onSubmit
  }
}
