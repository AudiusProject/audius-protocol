import { useCallback } from 'react'

import {
  OnRampProvider,
  buyAudioSelectors,
  buyAudioActions
} from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { OnRampButton } from 'components/on-ramp-button'
import Tooltip from 'components/tooltip/Tooltip'
import {
  createStripeSession,
  getRootSolanaAccount
} from 'services/audius-backend/BuyAudio'

import styles from './StripeBuyAudioButton.module.css'

const { getAudioPurchaseInfo } = buyAudioSelectors
const {
  onRampOpened,
  onRampSucceeded,
  onRampCanceled,
  stripeSessionStatusChanged
} = buyAudioActions

const STRIPE_PUBLISHABLE_KEY =
  process.env.REACT_APP_STRIPE_CLIENT_PUBLISHABLE_KEY

// TODO: Replace this with Stripe npm package when available
// @ts-ignore
const StripeOnRamp = window.StripeOnramp

const messages = {
  belowThreshold: 'Link by Stripe requires a purchase minimum of $1 USD'
}

export const StripeBuyAudioButton = () => {
  const dispatch = useDispatch()
  const [, setIsStripeModalVisible] = useModalState('StripeOnRamp')

  const purchaseInfo = useSelector(getAudioPurchaseInfo)
  const amount =
    purchaseInfo?.isError === false
      ? purchaseInfo.estimatedSOL.uiAmountString
      : undefined
  const belowThreshold =
    purchaseInfo?.isError === false && purchaseInfo.estimatedUSD.uiAmount < 1

  const handleSessionUpdate = useCallback(
    (e: any) => {
      if (e?.payload?.session?.status) {
        dispatch(
          stripeSessionStatusChanged({ status: e.payload.session.status })
        )
        if (e.payload.session.status === 'fulfillment_complete') {
          dispatch(onRampSucceeded())
          setIsStripeModalVisible(false)
        }
      }
    },
    [dispatch, setIsStripeModalVisible]
  )

  const handleClick = useCallback(async () => {
    if (!amount || !purchaseInfo || purchaseInfo?.isError === true) {
      return
    }
    dispatch(onRampOpened(purchaseInfo))
    try {
      const res = await createStripeSession({
        amount,
        destinationWallet: (await getRootSolanaAccount()).publicKey.toString()
      })
      const stripeOnRampInstance = StripeOnRamp(STRIPE_PUBLISHABLE_KEY)
      const session = stripeOnRampInstance.createSession({
        clientSecret: res.client_secret
      })
      session.mount('#stripe-onramp-modal')
      session.addEventListener('onramp_session_updated', handleSessionUpdate)
      setIsStripeModalVisible(true)
    } catch (e) {
      dispatch(onRampCanceled())
      console.error(e)
    }
  }, [
    dispatch,
    setIsStripeModalVisible,
    handleSessionUpdate,
    amount,
    purchaseInfo
  ])

  return (
    <Tooltip
      className={styles.tooltip}
      text={messages.belowThreshold}
      disabled={!belowThreshold}
      color={'--secondary'}
      shouldWrapContent={false}
    >
      <div>
        <OnRampButton
          isDisabled={belowThreshold}
          disabled={belowThreshold}
          className={styles.button}
          provider={OnRampProvider.STRIPE}
          onClick={handleClick}
        />
      </div>
    </Tooltip>
  )
}
