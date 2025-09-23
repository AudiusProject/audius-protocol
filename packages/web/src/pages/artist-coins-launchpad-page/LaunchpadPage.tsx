import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  ConnectedWallet,
  getWalletSolBalanceOptions,
  useConnectedWallets,
  useCurrentAccountUser,
  useQueryContext
} from '@audius/common/api'
import { TOKEN_LISTING_MAP } from '@audius/common/src/store/ui/shared/tokenConstants'
import { toast } from '@audius/common/src/store/ui/toast/slice'
import { shortenSPLAddress } from '@audius/common/utils'
import { FixedDecimal, wAUDIO } from '@audius/fixed-decimal'
import { Flex, IconArtistCoin, Text } from '@audius/harmony'
import { solana } from '@reown/appkit/networks'
import { useQueryClient } from '@tanstack/react-query'
import { Form, Formik, useFormikContext } from 'formik'
import { useDispatch } from 'react-redux'

import { appkitModal } from 'app/ReownAppKitModal'
import { Header } from 'components/header/desktop/Header'
import { useMobileHeader } from 'components/header/mobile/hooks'
import Page from 'components/page/Page'
import {
  useConnectAndAssociateWallets,
  AlreadyAssociatedError
} from 'hooks/useConnectAndAssociateWallets'
import { useExternalWalletSwap } from 'hooks/useExternalWalletSwap'
import { LaunchCoinResponse, useLaunchCoin } from 'hooks/useLaunchCoin'

import { ConnectedWalletHeader } from './components'
import {
  InsufficientBalanceModal,
  LaunchpadSubmitModal
} from './components/LaunchpadModals'
import type { SetupFormValues } from './components/types'
import { LAUNCHPAD_COIN_DESCRIPTION, MIN_SOL_BALANCE, Phase } from './constants'
import { BuyCoinPage, ReviewPage, SetupPage, SplashPage } from './pages'
import { getLatestConnectedWallet } from './utils'
import { useLaunchpadFormSchema } from './validation'

const messages = {
  title: 'Create Your Artist Coin',
  walletAdded: 'Wallet connected successfully',
  errors: {
    coinCreationFailed: 'Coin creation failed. Please try again.',
    firstBuyFailed: 'Coin purchase failed. Please try again.',
    firstBuyFailedToast: 'Coin created! Your purchase failed, please try again.'
  }
}

const LaunchpadPageContent = ({
  submitErrorText
}: {
  submitErrorText?: string
}) => {
  const [phase, setPhase] = useState(Phase.SPLASH)
  const { resetForm, validateForm } = useFormikContext()
  const queryClient = useQueryClient()
  const queryContext = useQueryContext()
  const { data: connectedWallets } = useConnectedWallets()
  const connectedWallet = useMemo(
    () => getLatestConnectedWallet(connectedWallets),
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
      const balanceData = await queryClient.fetchQuery({
        ...getWalletSolBalanceOptions(queryContext, {
          walletAddress
        }),
        staleTime: 0
      })

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
        const lastConnectedWallet = getLatestConnectedWallet(connectedWallets)
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
        return (
          <BuyCoinPage
            onBack={handleBuyCoinBack}
            submitErrorText={submitErrorText}
          />
        )
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
    isPending: isLaunchCoinPending,
    isSuccess: isLaunchCoinFinished,
    data: launchCoinResponse,
    isError: uncaughtLaunchCoinError
  } = useLaunchCoin()
  const {
    mutate: swapTokens,
    isPending: isSwapPending,
    isSuccess: isSwapFinished,
    isError: isSwapError,
    data: swapData
  } = useExternalWalletSwap()

  console.log({ swapData })
  const swapError = !!swapData?.isError
  const isSwapSuccess = isSwapFinished && !swapError
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data: user } = useCurrentAccountUser()
  const { data: connectedWallets } = useConnectedWallets()
  const { validationSchema } = useLaunchpadFormSchema()
  const dispatch = useDispatch()
  const isPoolCreateError =
    launchCoinResponse?.isError &&
    !launchCoinResponse?.errorMetadata?.poolCreateConfirmed
  const isFirstBuyError =
    launchCoinResponse?.isError &&
    launchCoinResponse?.errorMetadata?.poolCreateConfirmed &&
    launchCoinResponse?.errorMetadata?.sdkCoinAdded &&
    !launchCoinResponse?.errorMetadata?.firstBuyConfirmed

  const isSuccess =
    (isLaunchCoinFinished && !launchCoinResponse?.isError) || isSwapSuccess
  const isPending = isLaunchCoinPending || isSwapPending
  const isError =
    uncaughtLaunchCoinError || !!launchCoinResponse?.isError || isSwapError

  // If an error occurs before the pool is created, we close the modal so the user can resubmit
  useEffect(() => {
    if (isPoolCreateError || swapError) {
      setIsModalOpen(false)
    }
  }, [isPoolCreateError, swapError])

  useEffect(() => {
    if (isFirstBuyError) {
      setIsModalOpen(false)
      dispatch(
        toast({
          content: messages.errors.firstBuyFailedToast
        })
      )
    }
  }, [isFirstBuyError, dispatch])

  // Handle swap results for first buy transaction
  useEffect(() => {
    if (isSwapError && swapError) {
      setIsModalOpen(false)
      // Show error toast but keep modal open for retry
      dispatch(
        toast({
          content: messages.errors.firstBuyFailed
        })
      )
    }
  }, [isSwapError, swapError, dispatch])

  const handleSubmit = useCallback(
    (formValues: SetupFormValues) => {
      // Get the most recent connected Solana wallet (last in the array)
      const connectedWallet: ConnectedWallet | undefined =
        getLatestConnectedWallet(connectedWallets)

      setIsModalOpen(true)
      if (!user) {
        throw new Error('No current user found for unknown reason')
      }
      if (!connectedWallet) {
        throw new Error('No connected wallet found')
      }
      const audioAmountBigNumber = formValues.payAmount
        ? wAUDIO(formValues.payAmount).value.toString()
        : undefined

      // Check if we've already attempted to submit and created the pool already
      if (
        launchCoinResponse?.errorMetadata?.poolCreateConfirmed &&
        launchCoinResponse?.errorMetadata?.sdkCoinAdded &&
        !launchCoinResponse?.errorMetadata?.firstBuyConfirmed
      ) {
        const mintAddress =
          launchCoinResponse.newMint ||
          launchCoinResponse?.errorMetadata?.coinMetadata?.mint
        // The pool has already been created but something went wrong with the first buy transaction
        if (formValues.payAmount && mintAddress) {
          // In this instance, we can't use the same first buy transaction since the user can change the form inputs
          // Additionally the first buy TX already failed once so we want a new one
          swapTokens({
            inputToken: TOKEN_LISTING_MAP.AUDIO,
            outputToken: {
              address: mintAddress,
              decimals: 9,
              symbol: formValues.coinSymbol,
              name: formValues.coinName,
              balance: null
            },
            walletAddress: connectedWallet.address,
            inputAmountUi: Number(new FixedDecimal(formValues.payAmount).value),
            isAMM: true
          })
        } else {
          setIsModalOpen(false)
        }
      } else {
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
          initialBuyAmountAudio: audioAmountBigNumber
        })
      }
    },
    [
      connectedWallets,
      user,
      launchCoinResponse?.errorMetadata?.poolCreateConfirmed,
      launchCoinResponse?.errorMetadata?.sdkCoinAdded,
      launchCoinResponse?.errorMetadata?.firstBuyConfirmed,
      launchCoinResponse?.errorMetadata?.coinMetadata?.mint,
      launchCoinResponse?.newMint,
      swapTokens,
      launchCoin
    ]
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
      validationSchema={validationSchema}
      validateOnMount={true}
      validateOnChange={true}
      validateOnBlur={true}
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
          errorMetadata={launchCoinResponse?.errorMetadata}
        />
        <LaunchpadPageContent
          submitErrorText={
            isPoolCreateError
              ? messages.errors.coinCreationFailed
              : swapError || isFirstBuyError
                ? messages.errors.firstBuyFailed
                : undefined
          }
        />
      </Form>
    </Formik>
  )
}
