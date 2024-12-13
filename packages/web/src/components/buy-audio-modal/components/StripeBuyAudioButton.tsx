import { useCallback } from 'react'

import { useAudiusQueryContext } from '@audius/common/audius-query'
import {
  stripeModalUIActions,
  buyAudioActions,
  buyAudioSelectors,
  modalsActions,
  OnRampProvider
} from '@audius/common/store'
import { useDispatch, useSelector } from 'react-redux'

import { OnRampButton } from 'components/on-ramp-button'
import Tooltip from 'components/tooltip/Tooltip'

import styles from './StripeBuyAudioButton.module.css'
const { setVisibility } = modalsActions

const { getAudioPurchaseInfo } = buyAudioSelectors
const { onrampOpened, onrampSucceeded, onrampCanceled } = buyAudioActions
const { initializeStripeModal } = stripeModalUIActions

const messages = {
  belowThreshold: 'Link by Stripe requires a purchase minimum of $1 USD'
}

export const StripeBuyAudioButton = () => {
  const dispatch = useDispatch()
  const { solanaWalletService } = useAudiusQueryContext()

  const purchaseInfo = useSelector(getAudioPurchaseInfo)
  const amount =
    purchaseInfo?.isError === false
      ? purchaseInfo.estimatedSOL.uiAmountString
      : undefined
  const belowThreshold =
    purchaseInfo?.isError === false && purchaseInfo.estimatedUSD.uiAmount < 1

  const handleClick = useCallback(async () => {
    if (!amount || !purchaseInfo || purchaseInfo?.isError === true) {
      return
    }
    dispatch(onrampOpened(purchaseInfo))
    try {
      const rootWallet = await solanaWalletService.getKeypair()
      if (!rootWallet) {
        console.error('StripeBuyAudioButton: Missing solana root wallet')
        return
      }
      const destinationWallet: string = rootWallet.publicKey.toString()
      dispatch(
        initializeStripeModal({
          amount,
          onrampSucceeded: onrampSucceeded(),
          onrampCanceled: onrampCanceled(),
          onrampFailed: onrampCanceled(),
          destinationCurrency: 'sol',
          destinationWallet
        })
      )
      dispatch(setVisibility({ modal: 'StripeOnRamp', visible: true }))
    } catch (e) {
      dispatch(onrampCanceled())
      console.error(e)
    }
  }, [dispatch, amount, purchaseInfo, solanaWalletService])

  return (
    <Tooltip
      className={styles.tooltip}
      text={messages.belowThreshold}
      disabled={!belowThreshold}
      color='secondary'
      shouldWrapContent={false}
    >
      <OnRampButton
        disabled={belowThreshold}
        provider={OnRampProvider.STRIPE}
        onClick={handleClick}
      />
    </Tooltip>
  )
}
