import { useCallback } from 'react'

import { ConnectedWallet } from '@audius/common/api'
import { useAnalytics } from '@audius/common/hooks'
import { Chain, Name } from '@audius/common/models'
import { useFormikContext } from 'formik'

import { make } from 'services/analytics'

import type { SetupFormValues } from './components/types'
import { MIN_SOL_BALANCE } from './constants'

/**
 * Gets the most recently added connected wallet
 */
export const getLatestConnectedWallet = (
  connectedWallets: ConnectedWallet[] | undefined
) => {
  return connectedWallets?.filter(
    (wallet: ConnectedWallet) => wallet.chain === Chain.Sol
  )?.[0]
}

export const useLaunchpadAnalytics = () => {
  const { track } = useAnalytics()
  const { values: formValues } = useFormikContext<SetupFormValues>()

  // Splash page events
  const trackSplashContinue = useCallback(() => {
    track(
      make({
        eventName: Name.LAUNCHPAD_SPLASH_CONTINUE
      })
    )
  }, [track])

  // Wallet connection events
  const trackWalletConnected = useCallback(
    (walletAddress: string, walletBalance: number) => {
      track(
        make({
          eventName: Name.LAUNCHPAD_WALLET_CONNECTED,
          walletAddress,
          walletBalance
        })
      )
    },
    [track]
  )

  const trackWalletInsufficientBalance = useCallback(
    (walletAddress: string, walletBalance: number) => {
      track(
        make({
          eventName: Name.LAUNCHPAD_WALLET_INSUFFICIENT_BALANCE,
          walletAddress,
          walletBalance,
          requiredBalance: MIN_SOL_BALANCE
        })
      )
    },
    [track]
  )

  // Form progression events
  const trackSetupContinue = useCallback(
    (formData?: Partial<SetupFormValues>) => {
      const values = formData || formValues
      track(
        make({
          eventName: Name.LAUNCHPAD_SETUP_CONTINUE,
          coinName: values.coinName || '',
          coinSymbol: values.coinSymbol || '',
          hasImage: !!values.coinImage,
          wantsToBuy: values.wantsToBuy || 'no',
          payAmount: values.payAmount || undefined
        })
      )
    },
    [track, formValues]
  )

  const trackReviewContinue = useCallback(
    (formData?: Partial<SetupFormValues>) => {
      const values = formData || formValues
      track(
        make({
          eventName: Name.LAUNCHPAD_REVIEW_CONTINUE,
          coinName: values.coinName || '',
          coinSymbol: values.coinSymbol || '',
          payAmount: values.payAmount || undefined,
          receiveAmount: values.receiveAmount || undefined
        })
      )
    },
    [track, formValues]
  )

  // Coin creation events
  const trackCoinCreationStarted = useCallback(
    (walletAddress: string, initialBuyAmount?: string) => {
      track(
        make({
          eventName: Name.LAUNCHPAD_COIN_CREATION_STARTED,
          coinName: formValues.coinName || '',
          coinSymbol: formValues.coinSymbol || '',
          walletAddress,
          initialBuyAmount
        })
      )
    },
    [track, formValues]
  )

  const trackCoinCreationSuccess = useCallback(
    (mintAddress: string, initialBuyAmount?: string) => {
      track(
        make({
          eventName: Name.LAUNCHPAD_COIN_CREATION_SUCCESS,
          coinName: formValues.coinName || '',
          coinSymbol: formValues.coinSymbol || '',
          mintAddress,
          initialBuyAmount
        })
      )
    },
    [track, formValues]
  )

  const trackCoinCreationFailure = useCallback(
    (error: string, stage: 'pool_creation' | 'coin_metadata' | 'first_buy') => {
      track(
        make({
          eventName: Name.LAUNCHPAD_COIN_CREATION_FAILURE,
          coinName: formValues.coinName || '',
          coinSymbol: formValues.coinSymbol || '',
          error,
          stage
        })
      )
    },
    [track, formValues]
  )

  // First buy transaction events
  const trackFirstBuyStarted = useCallback(
    (mintAddress: string, payAmount: string, receiveAmount: string) => {
      track(
        make({
          eventName: Name.LAUNCHPAD_FIRST_BUY_STARTED,
          coinSymbol: formValues.coinSymbol || '',
          mintAddress,
          payAmount,
          receiveAmount
        })
      )
    },
    [track, formValues]
  )

  const trackFirstBuySuccess = useCallback(
    (mintAddress: string, payAmount: string, receiveAmount: string) => {
      track(
        make({
          eventName: Name.LAUNCHPAD_FIRST_BUY_SUCCESS,
          coinSymbol: formValues.coinSymbol || '',
          mintAddress,
          payAmount,
          receiveAmount
        })
      )
    },
    [track, formValues]
  )

  const trackFirstBuyFailure = useCallback(
    (mintAddress: string, payAmount: string, error: string) => {
      track(
        make({
          eventName: Name.LAUNCHPAD_FIRST_BUY_FAILURE,
          coinSymbol: formValues.coinSymbol || '',
          mintAddress,
          payAmount,
          error
        })
      )
    },
    [track, formValues]
  )

  const trackFirstBuyRetry = useCallback(
    (mintAddress: string, payAmount: string) => {
      track(
        make({
          eventName: Name.LAUNCHPAD_FIRST_BUY_RETRY,
          coinSymbol: formValues.coinSymbol || '',
          mintAddress,
          payAmount
        })
      )
    },
    [track, formValues]
  )

  return {
    // Page view
    trackPageView,
    // Splash page
    trackSplashContinue,
    // Wallet connection
    trackWalletConnected,
    trackWalletInsufficientBalance,
    // Form progression
    trackSetupContinue,
    trackReviewContinue,
    // Coin creation
    trackCoinCreationStarted,
    trackCoinCreationSuccess,
    trackCoinCreationFailure,
    // First buy transaction
    trackFirstBuyStarted,
    trackFirstBuySuccess,
    trackFirstBuyFailure,
    trackFirstBuyRetry
  }
}
