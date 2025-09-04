import { useState } from 'react'

import { IconArtistCoin } from '@audius/harmony'
import { solana } from '@reown/appkit/networks'
import { Formik, useFormikContext } from 'formik'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { appkitModal } from 'app/ReownAppKitModal'
import { Header } from 'components/header/desktop/Header'
import { useMobileHeader } from 'components/header/mobile/hooks'
import Page from 'components/page/Page'
import {
  useConnectAndAssociateWallets,
  AlreadyAssociatedError
} from 'hooks/useConnectAndAssociateWallets'

import { BuyCoinPage, ReviewPage, SetupPage, SplashScreen } from './components'
import type { SetupFormValues } from './components/types'
import { Phase } from './constants'
import { setupFormSchema } from './validation'

const messages = {
  title: 'Create Your Artist Coin'
}

const LaunchpadPageContent = () => {
  const [phase, setPhase] = useState(Phase.SPLASH)
  const { resetForm, validateForm } = useFormikContext()

  // Set up mobile header with icon
  useMobileHeader({
    title: messages.title
  })

  const header = <Header primary={messages.title} icon={IconArtistCoin} />

  // Wallet connection handlers
  const handleWalletConnectSuccess = () => {
    setPhase(Phase.SETUP)
  }

  const handleWalletConnectError = (error: unknown) => {
    console.error('Wallet connection failed:', error)

    // If wallet is already associated, continue with the flow
    if (error instanceof AlreadyAssociatedError) {
      setPhase(Phase.SETUP)
      return
    }

    // For other errors, show alert
    alert('Failed to connect wallet. Please try again.')
  }

  const { openAppKitModal } = useConnectAndAssociateWallets(
    handleWalletConnectSuccess,
    handleWalletConnectError
  )

  const handleSplashContinue = async () => {
    // Switch to Solana network to prioritize SOL wallets
    await appkitModal.switchNetwork(solana)
    openAppKitModal()
  }

  const handleSetupContinue = () => {
    setPhase(Phase.REVIEW)
  }

  const handleSetupBack = async () => {
    resetForm()
    await validateForm()
    setPhase(Phase.SPLASH)
  }

  const handleReviewContinue = () => {
    setPhase(Phase.BUY_COIN)
  }

  const handleReviewBack = () => {
    setPhase(Phase.SETUP)
  }

  const handleBuyCoinContinue = () => {
    // This should submit the form as requested
    alert('Coin created successfully!')
  }

  const handleBuyCoinBack = () => {
    setPhase(Phase.REVIEW)
  }

  const renderCurrentPage = () => {
    switch (phase) {
      case Phase.SPLASH:
        return <SplashScreen onContinue={handleSplashContinue} />
      case Phase.SETUP:
        return (
          <SetupPage
            onContinue={handleSetupContinue}
            onBack={handleSetupBack}
          />
        )
      case Phase.REVIEW:
        return (
          <ReviewPage
            onContinue={handleReviewContinue}
            onBack={handleReviewBack}
          />
        )
      case Phase.BUY_COIN:
        return (
          <BuyCoinPage
            onContinue={handleBuyCoinContinue}
            onBack={handleBuyCoinBack}
          />
        )
      default:
        return <SplashScreen onContinue={handleSplashContinue} />
    }
  }

  return (
    <Page
      title={messages.title}
      header={header}
      contentClassName='artist-coins-launchpad-page'
    >
      {renderCurrentPage()}
    </Page>
  )
}

export const LaunchpadPage = () => {
  return (
    <Formik
      initialValues={{
        coinName: '',
        coinSymbol: '',
        coinImage: null as File | null,
        payAmount: '',
        receiveAmount: ''
      }}
      validationSchema={toFormikValidationSchema(setupFormSchema)}
      validateOnMount={true}
      validateOnChange={true}
      onSubmit={(_values: SetupFormValues) => {
        // Convert coin symbol to uppercase before submission
        // TODO: Use the processed values in actual submission logic
        // const finalValues = {
        //   ...values,
        //   coinSymbol: values.coinSymbol.toUpperCase()
        // }

        // For now, this represents completing the entire flow
        alert('Coin created successfully!') // Temporary success indicator
      }}
    >
      <LaunchpadPageContent />
    </Formik>
  )
}
