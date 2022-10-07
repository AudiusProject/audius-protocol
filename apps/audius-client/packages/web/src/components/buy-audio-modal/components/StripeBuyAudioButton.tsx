import { useCallback } from 'react'

import {
  OnRampProvider,
  buyAudioSelectors,
  buyAudioActions
} from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { OnRampButton } from 'components/on-ramp-button'
import {
  createStripeSession,
  getRootSolanaAccount
} from 'services/audius-backend/BuyAudio'

const { getAudioPurchaseInfo } = buyAudioSelectors
const { calculateAudioPurchaseInfo, onRampOpened, onRampSucceeded } =
  buyAudioActions

const STRIPE_PUBLISHABLE_KEY =
  process.env.REACT_APP_STRIPE_CLIENT_PUBLISHABLE_KEY

// TODO: Replace this with Stripe npm package when available
// @ts-ignore
const StripeOnRamp = window.StripeOnramp

export const StripeBuyAudioButton = () => {
  const dispatch = useDispatch()
  const [, setIsStripeModalVisible] = useModalState('StripeOnRamp')

  const purchaseInfo = useSelector(getAudioPurchaseInfo)
  const amount =
    purchaseInfo?.isError === false
      ? purchaseInfo.estimatedSOL.uiAmountString
      : undefined

  const handleSessionUpdate = useCallback(
    (e) => {
      if (e.payload.session.state === 'fulfillment_complete') {
        dispatch(onRampSucceeded())
        setIsStripeModalVisible(false)
      }
    },
    [dispatch, setIsStripeModalVisible]
  )

  const handleClick = useCallback(async () => {
    if (!amount || !purchaseInfo || purchaseInfo?.isError === true) {
      return
    }
    dispatch(onRampOpened(purchaseInfo))
    const res = await createStripeSession({
      amount,
      destinationWallet: (await getRootSolanaAccount()).publicKey.toString()
    })
    const stripeOnRampInstance = StripeOnRamp(STRIPE_PUBLISHABLE_KEY)
    const session = stripeOnRampInstance.createSession({
      // TODO: Implement createStripeSession
      // @ts-ignore
      clientSecret: res.client_secret
    })
    session.mount('#stripe-onramp-modal')
    session.addEventListener('onramp_session_updated', handleSessionUpdate)
    setIsStripeModalVisible(true)
  }, [
    dispatch,
    setIsStripeModalVisible,
    handleSessionUpdate,
    amount,
    purchaseInfo
  ])

  return <OnRampButton provider={OnRampProvider.STRIPE} onClick={handleClick} />
}
