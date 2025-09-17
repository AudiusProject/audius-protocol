import { useCallback, useMemo, useState } from 'react'

import {
  ConnectedWallet,
  getWalletSolBalanceOptions,
  useConnectedWallets,
  useCurrentAccountUser,
  useQueryContext
} from '@audius/common/api'
import { Chain } from '@audius/common/models'
import { toast } from '@audius/common/src/store/ui/toast/slice'
import { shortenSPLAddress } from '@audius/common/utils'
import { FixedDecimal } from '@audius/fixed-decimal'
import { Flex, IconArtistCoin, Text } from '@audius/harmony'
import { solana } from '@reown/appkit/networks'
import { useQueryClient } from '@tanstack/react-query'
import { Form, Formik, useFormikContext } from 'formik'
import { useDispatch } from 'react-redux'
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

import { ConnectedWalletHeader } from './components'
import {
  InsufficientBalanceModal,
  LaunchpadSubmitModal
} from './components/LaunchpadModals'
import type { SetupFormValues } from './components/types'
import {
  LAUNCHPAD_COIN_DESCRIPTION,
  MIN_SOL_BALANCE,
  Phase,
  SOLANA_DECIMALS
} from './constants'
import { BuyCoinPage, ReviewPage, SetupPage, SplashPage } from './pages'
import { setupFormSchema } from './validation'

const messages = {
  title: 'Create Your Artist Coin',
  walletAdded: 'Wallet connected successfully'
}

const getConnectedWallet = (
  connectedWallets: ConnectedWallet[] | undefined
) => {
  return connectedWallets?.filter(
    (wallet: ConnectedWallet) => wallet.chain === Chain.Sol
  )?.[0]
}

const LaunchpadPageContent = () => {
  const [phase, setPhase] = useState(Phase.BUY_COIN)
  const { resetForm, validateForm } = useFormikContext()
  const queryClient = useQueryClient()
  const queryContext = useQueryContext()
  const { data: connectedWallets } = useConnectedWallets()
  const connectedWallet = useMemo(
    () => getConnectedWallet(connectedWallets),
    [connectedWallets]
  )
  const [isInsufficientBalanceModalOpen, setIsInsufficientBalanceModalOpen] =
    useState(false)
  const dispatch = useDispatch()

  // Set up mobile header with icon
  useMobileHeader({
    title: messages.title
  })

  const header = (
    <Header
      primary={messages.title}
      icon={IconArtistCoin}
      rightDecorator={
        connectedWallet && phase !== Phase.SPLASH ? (
          <ConnectedWalletHeader connectedWallet={connectedWallet} />
        ) : null
      }
    />
  )

  const getIsValidWalletBalance = useCallback(
    async (walletAddress: string) => {
      // Check if wallet has sufficient SOL balance
      const balanceData = await queryClient.fetchQuery(
        getWalletSolBalanceOptions(queryContext, {
          walletAddress
        })
      )

      const walletBalanceLamports = balanceData.balanceLamports
      return walletBalanceLamports > MIN_SOL_BALANCE
    },
    [queryClient, queryContext]
  )

  // NOTE: this hook specifically is after the wallet is both added & has sufficient balance
  const handleWalletAddSuccess = useCallback(
    (wallet: ConnectedWallet) => {
      setPhase(Phase.SETUP)
      dispatch(
        toast({
          content: (
            <Flex gap='xs' direction='column'>
              <Text>{messages.walletAdded}</Text>
              <Text>{shortenSPLAddress(wallet.address)}</Text>
            </Flex>
          )
        })
      )
    },
    [setPhase, dispatch]
  )

  // Wallet connection handlers
  const handleWalletConnectSuccess = useCallback(
    async (wallets: ConnectedWallet[]) => {
      const newWallet = wallets[0]

      const isValidWalletBalance = await getIsValidWalletBalance(
        newWallet.address
      )
      try {
        if (isValidWalletBalance) {
          handleWalletAddSuccess(newWallet)
        } else {
          setIsInsufficientBalanceModalOpen(true)
        }
      } catch (error) {
        alert('Failed to check wallet balance. Please try again.')
      }
    },
    [
      getIsValidWalletBalance,
      handleWalletAddSuccess,
      setIsInsufficientBalanceModalOpen
    ]
  )

  const handleWalletConnectError = useCallback(
    async (error: unknown) => {
      // If wallet is already linked, continue with the flow
      if (error instanceof AlreadyAssociatedError) {
        const lastConnectedWallet = getConnectedWallet(connectedWallets)
        if (lastConnectedWallet) {
          const isValidWalletBalance = await getIsValidWalletBalance(
            lastConnectedWallet?.address
          )
          if (isValidWalletBalance) {
            handleWalletAddSuccess(lastConnectedWallet)
          } else {
            setIsInsufficientBalanceModalOpen(true)
          }
        }
      }

      // TODO: add an error toast here
    },
    [
      connectedWallets,
      getIsValidWalletBalance,
      handleWalletAddSuccess,
      setIsInsufficientBalanceModalOpen
    ]
  )

  const { openAppKitModal, isPending: isWalletConnectPending } =
    useConnectAndAssociateWallets(
      handleWalletConnectSuccess,
      handleWalletConnectError
    )

  const handleSplashContinue = useCallback(async () => {
    // Switch to Solana network to prioritize SOL wallets
    await appkitModal.switchNetwork(solana)
    openAppKitModal()
  }, [openAppKitModal])

  const handleSetupContinue = useCallback(() => {
    setPhase(Phase.REVIEW)
  }, [])

  const handleSetupBack = useCallback(async () => {
    resetForm()
    await validateForm()
    setPhase(Phase.SPLASH)
  }, [resetForm, validateForm])

  const handleReviewContinue = useCallback(() => {
    setPhase(Phase.BUY_COIN)
  }, [])

  const handleReviewBack = useCallback(() => {
    setPhase(Phase.SETUP)
  }, [])

  const handleBuyCoinBack = useCallback(() => {
    setPhase(Phase.REVIEW)
  }, [])

  const renderCurrentPage = () => {
    switch (phase) {
      case Phase.SPLASH:
        return (
          <SplashPage
            onContinue={handleSplashContinue}
            isPending={isWalletConnectPending}
          />
        )
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
        return (
          <SplashPage
            onContinue={handleSplashContinue}
            isPending={isWalletConnectPending}
          />
        )
    }
  }

  return (
    <>
      <InsufficientBalanceModal
        isOpen={isInsufficientBalanceModalOpen}
        onClose={() => setIsInsufficientBalanceModalOpen(false)}
      />
      <Page
        title={messages.title}
        header={header}
        contentClassName='artist-coins-launchpad-page'
      >
        {renderCurrentPage()}
      </Page>
    </>
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

  const handleSubmit = useCallback(
    (formValues: SetupFormValues) => {
      // Get the most recent connected Solana wallet (last in the array)
      // Filter to only Solana wallets since only SOL wallets can be connected
      const connectedWallet: ConnectedWallet | undefined =
        getConnectedWallet(connectedWallets)

      setIsModalOpen(true)
      if (!user) {
        throw new Error('No current user found for unknown reason')
      }
      if (!connectedWallet) {
        throw new Error('No connected wallet found')
      }
      const payAmountLamports = formValues.payAmount
        ? Number(
            new FixedDecimal(formValues.payAmount, SOLANA_DECIMALS).trunc(
              SOLANA_DECIMALS
            ).value
          )
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
    [launchCoin, user, connectedWallets]
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
        <LaunchpadSubmitModal
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
