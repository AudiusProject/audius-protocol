import { useCallback, useMemo, useState } from 'react'

import {
  ConnectedWallet,
  useConnectedWallets,
  useCurrentAccountUser
} from '@audius/common/api'
import { Chain } from '@audius/common/models'
import { FixedDecimal } from '@audius/fixed-decimal'
import { IconArtistCoin } from '@audius/harmony'
import { solana } from '@reown/appkit/networks'
import { Form, Formik, useFormikContext } from 'formik'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { appkitModal } from 'app/ReownAppKitModal'
import { Header } from 'components/header/desktop/Header'
import { useMobileHeader } from 'components/header/mobile/hooks'
import Page from 'components/page/Page'
import {
  useConnectAndAssociateWallets,
  AlreadyAssociatedError
} from 'hooks/useConnectAndAssociateWallets'
import { useLaunchCoin } from 'hooks/useLaunchCoin'

import { LaunchpadModal } from './components/LaunchpadModal'
import type { SetupFormValues } from './components/types'
import { LAUNCHPAD_COIN_DESCRIPTION, Phase } from './constants'
import { BuyCoinPage, ReviewPage, SetupPage, SplashPage } from './pages'
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

  const handleBuyCoinBack = () => {
    setPhase(Phase.REVIEW)
  }

  const renderCurrentPage = () => {
    switch (phase) {
      case Phase.SPLASH:
        return <SplashPage onContinue={handleSplashContinue} />
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
        return <BuyCoinPage onBack={handleBuyCoinBack} />
      default:
        return <SplashPage onContinue={handleSplashContinue} />
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
  const {
    mutate: launchCoin,
    isPending,
    isSuccess,
    data: launchCoinResponse,
    isError
  } = useLaunchCoin()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data: user } = useCurrentAccountUser()
  const { data: connectedWallets } = useConnectedWallets()

  // Get the most recent connected Solana wallet (last in the array)
  // Filter to only Solana wallets since only SOL wallets can be connected
  const connectedWallet: ConnectedWallet | undefined = useMemo(
    () => connectedWallets?.filter((wallet) => wallet.chain === Chain.Sol)?.[0],
    [connectedWallets]
  )

  const handleSubmit = useCallback(
    (formValues: SetupFormValues) => {
      setIsModalOpen(true)
      if (!user) {
        throw new Error('No current user found for unknown reason')
      }
      if (!connectedWallet) {
        throw new Error('No connected wallet found')
      }
      const payAmountLamports = formValues.payAmount
        ? Number(new FixedDecimal(formValues.payAmount, 9).trunc(9).value)
        : undefined
      launchCoin({
        userId: user.user_id,
        name: formValues.coinName,
        symbol: formValues.coinSymbol,
        image: formValues.coinImage!,
        description: LAUNCHPAD_COIN_DESCRIPTION(
          user.handle,
          formValues.coinSymbol
        ),
        walletPublicKey: connectedWallet.address,
        initialBuyAmountSolLamports: payAmountLamports
      })
    },
    [launchCoin, user, connectedWallet]
  )

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
      onSubmit={handleSubmit}
    >
      <Form>
        <LaunchpadModal
          isPending={isPending}
          isSuccess={isSuccess}
          isError={isError}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mintAddress={launchCoinResponse?.newMint}
          logoUri={launchCoinResponse?.logoUri}
        />
        <LaunchpadPageContent />
      </Form>
    </Formik>
  )
}
