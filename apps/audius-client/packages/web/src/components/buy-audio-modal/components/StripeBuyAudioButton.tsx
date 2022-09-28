import { useCallback } from 'react'

import {
  OnRampProvider,
  buyAudioSelectors,
  accountSelectors,
  buyAudioActions
} from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { OnRampButton } from 'components/on-ramp-button'
import { createStripeSession } from 'services/audius-backend/BuyAudio'

const { getAccountUser } = accountSelectors
const { getAudioPurchaseInfo } = buyAudioSelectors
const { calculateAudioPurchaseInfo } = buyAudioActions

const STRIPE_PUBLISHABLE_KEY =
  process.env.REACT_APP_STRIPE_CLIENT_PUBLISHABLE_KEY

// TODO: Replace this with Stripe npm package when available
// @ts-ignore
const StripeOnRamp = window.StripeOnramp

export const StripeBuyAudioButton = () => {
  const dispatch = useDispatch()
  const [, setIsStripeModalVisible] = useModalState('StripeOnRamp')
  const user = useSelector(getAccountUser)

  const purchaseInfo = useSelector(getAudioPurchaseInfo)
  const amount =
    purchaseInfo?.isError === false
      ? purchaseInfo.estimatedSOL.uiAmountString
      : undefined

  const handleClick = useCallback(async () => {
    if (!user?.userBank) {
      console.error('Missing user bank')
      return
    }
    if (!amount) {
      dispatch(calculateAudioPurchaseInfo({ audioAmount: 0 }))
      return
    }
    const res = await createStripeSession({
      amount,
      destinationWallet: user.userBank
    })
    const stripeOnRampInstance = StripeOnRamp(STRIPE_PUBLISHABLE_KEY)
    const session = stripeOnRampInstance.createSession({
      // TODO: Implement createStripeSession
      // @ts-ignore
      clientSecret: res.client_secret
    })
    session.mount('#stripe-onramp-modal')
    setIsStripeModalVisible(true)
  }, [dispatch, setIsStripeModalVisible, amount, user])

  return <OnRampButton provider={OnRampProvider.STRIPE} onClick={handleClick} />
}
