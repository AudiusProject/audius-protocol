import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  ConnectedWallet,
  getWalletSolBalanceOptions,
  useConnectedWallets,
  useCurrentAccountUser,
  useQueryContext
} from '@audius/common/api'
import { launchpadMessages } from '@audius/common/messages'
import { Feature } from '@audius/common/src/models/ErrorReporting'
import { TOKEN_LISTING_MAP } from '@audius/common/src/store/ui/shared/tokenConstants'
import { toast } from '@audius/common/src/store/ui/toast/slice'
import { ASSET_DETAIL_PAGE } from '@audius/common/src/utils/route'
import { useCoinSuccessModal } from '@audius/common/store'
import { shortenSPLAddress } from '@audius/common/utils'
import { FixedDecimal, wAUDIO } from '@audius/fixed-decimal'
import { Flex, IconArtistCoin, IconCheck, Text } from '@audius/harmony'
import { solana } from '@reown/appkit/networks'
import { useQueryClient } from '@tanstack/react-query'
import { Form, Formik, useFormikContext } from 'formik'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom-v5-compat'

import { appkitModal } from 'app/ReownAppKitModal'
import { Header } from 'components/header/desktop/Header'
import { useMobileHeader } from 'components/header/mobile/hooks'
import Page from 'components/page/Page'
import {
  useConnectAndAssociateWallets,
  AlreadyAssociatedError
} from 'hooks/useConnectAndAssociateWallets'
import { useExternalWalletSwap } from 'hooks/useExternalWalletSwap'
import { LAUNCHPAD_COIN_DECIMALS, useLaunchCoin } from 'hooks/useLaunchCoin'
import { reportToSentry } from 'store/errors/reportToSentry'

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
    firstBuyFailedToast:
      'Coin created! Your purchase failed, please try again.',
    unknownError:
      'An unknown error occurred. The Audius team has been notified.'
  }
}

const LaunchpadPageContent = ({
  submitErrorText,
  submitButtonText
}: {
  submitErrorText?: string
  submitButtonText?: string
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
    title: launchpadMessages.page.title
  })

  const header = (
    <Header
      primary={launchpadMessages.page.title}
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
              <Text>{launchpadMessages.page.walletAdded}</Text>
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
            submitButtonText={submitButtonText}
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
        title={launchpadMessages.page.title}
        header={header}
        contentClassName='artist-coins-launchpad-page'
      >
        {renderCurrentPage()}
      </Page>
    </>
  )
}

export const LaunchpadPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const dispatch = useDispatch()
  const { data: user } = useCurrentAccountUser()
  const { data: connectedWallets } = useConnectedWallets()
  const { validationSchema } = useLaunchpadFormSchema()
  const [formValues, setFormValues] = useState<SetupFormValues | null>(null)

  const { onOpen: openCoinSuccessModal } = useCoinSuccessModal()
  const navigate = useNavigate()

  // Launch coin mutation hook - this handles pool creation, sdk coin creation, and first buy transaction
  const {
    mutate: launchCoin,
    isPending: isLaunchCoinPending,
    isSuccess: isLaunchCoinFinished,
    data: launchCoinResponse,
    isError: uncaughtLaunchCoinError
  } = useLaunchCoin()

  // If something during coin launch hook fails, this errorMetadata is used to trigger recovery flows
  const errorMetadata = launchCoinResponse?.errorMetadata

  const isLaunchCoinError = launchCoinResponse?.isError
  const isPoolCreateError =
    isLaunchCoinError && errorMetadata?.poolCreateConfirmed
  const isFirstBuyError =
    isLaunchCoinError &&
    errorMetadata?.poolCreateConfirmed &&
    !errorMetadata?.firstBuyConfirmed &&
    errorMetadata?.requestedFirstBuy

  // This hook is used in the case where the first buy TX failed for some reason but the pool was created successfully
  // Since the pool is launched, we can retry the first buy transaction with a new jupiter swap TX
  const {
    mutate: swapTokens,
    isPending: isSwapRetryPending,
    isSuccess: isSwapRetryFinished,
    data: swapData
  } = useExternalWalletSwap()

  const isSwapRetryError = !!swapData?.isError
  const isSwapRetrySuccess = isSwapRetryFinished && !isSwapRetryError

  // Overall success, pending, and error states account for both hooks
  const isSuccess =
    (isLaunchCoinFinished && !isLaunchCoinError) || isSwapRetrySuccess
  const isPending = isLaunchCoinPending || isSwapRetryPending
  const isError =
    uncaughtLaunchCoinError || isLaunchCoinError || isSwapRetryError

  // If an error occurs after the pool is created, we close the modal to let the user resubmit via the swap retry flow
  useEffect(() => {
    if (isPoolCreateError) {
      setIsModalOpen(false)
    }
  }, [isPoolCreateError])

  // Handle successful coin creation
  useEffect(() => {
    if (isSuccess && launchCoinResponse && formValues) {
      // Show toast notification
      dispatch(
        toast({
          content: (
            <Flex gap='xs'>
              <IconCheck size='m' color='white' />
              <Text>{launchpadMessages.toast.coinCreated}</Text>
            </Flex>
          )
        })
      )

      // Navigate to the new coin's detail page
      navigate(ASSET_DETAIL_PAGE.replace(':ticker', formValues.coinSymbol))

      // Open the success modal
      openCoinSuccessModal({
        mint: launchCoinResponse.newMint,
        name: formValues.coinName,
        ticker: formValues.coinSymbol,
        logoUri: launchCoinResponse.logoUri,
        amountUi: formValues.receiveAmount || '0',
        amountUsd: formValues.usdcValue || '0'
      })
    }
  }, [
    isLaunchCoinFinished,
    launchCoinResponse,
    openCoinSuccessModal,
    dispatch,
    navigate,
    formValues,
    isError,
    isSuccess
  ])

  // If the swap retry fails close the modal again and let user attempt to resubmit if they want
  useEffect(() => {
    if (isSwapRetryError) {
      setIsModalOpen(false)
    }
  }, [isSwapRetryError])

  // If the first buy TX fails, we show a toast and close the modal
  // they are still able to attempt to resubmit
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
    if (isSwapRetryError) {
      // Show error toast but keep modal open for retry
      dispatch(
        toast({
          content: messages.errors.firstBuyFailed
        })
      )
    }
  }, [isSwapRetryError, dispatch])

  const handleSubmit = useCallback(
    (formValues: SetupFormValues) => {
      // Store form values for success modal
      setFormValues(formValues)

      // Get the most recent connected Solana wallet (last in the array)
      const connectedWallet: ConnectedWallet | undefined =
        getLatestConnectedWallet(connectedWallets)

      if (!user || !connectedWallet) {
        dispatch(
          toast({
            content: messages.errors.unknownError
          })
        )
        reportToSentry({
          error: new Error(
            'Unable to submit launchpad form. No user or connected wallet found'
          ),
          name: 'Launchpad Submit Error',
          feature: Feature.ArtistCoins,
          additionalInfo: {
            user,
            connectedWallet,
            formValues
          }
        })
        throw new Error('No user or connected wallet found')
      }

      setIsModalOpen(true)
      const audioAmountBigNumber = formValues.payAmount
        ? wAUDIO(formValues.payAmount).value.toString()
        : undefined

      // Check if we've already attempted to submit and need to retry the first buy transaction instead of creating a new pool
      if (isFirstBuyError) {
        // Recover the mint address from the error metadata
        const mintAddress =
          launchCoinResponse.newMint || errorMetadata?.coinMetadata?.mint
        if (formValues.payAmount && mintAddress) {
          // Retry the first buy transaction with a new swap TX
          swapTokens({
            inputToken: TOKEN_LISTING_MAP.AUDIO,
            outputToken: {
              address: mintAddress,
              decimals: LAUNCHPAD_COIN_DECIMALS
            },
            walletAddress: connectedWallet.address,
            inputAmountUi: Number(new FixedDecimal(formValues.payAmount).value),
            isAMM: true
          })
        } else {
          setIsModalOpen(false)
          dispatch(
            toast({
              content: messages.errors.unknownError
            })
          )
          reportToSentry({
            error: new Error(
              'First buy retry failed. No mint address or pay amount found.'
            ),
            name: 'First Buy Retry Failure',
            feature: Feature.ArtistCoins,
            additionalInfo: {
              errorMetadata,
              formValues
            }
          })
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
      isFirstBuyError,
      launchCoinResponse?.newMint,
      errorMetadata,
      swapTokens,
      dispatch,
      launchCoin
    ]
  )

  return (
    <Formik<SetupFormValues>
      initialValues={{
        coinName: '',
        coinSymbol: '',
        coinImage: null as File | null,
        payAmount: '',
        receiveAmount: '',
        usdcValue: ''
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
          isError={isError}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mintAddress={launchCoinResponse?.newMint}
          logoUri={launchCoinResponse?.logoUri}
          errorMetadata={errorMetadata}
        />
        <LaunchpadPageContent
          submitErrorText={
            isPoolCreateError
              ? messages.errors.coinCreationFailed
              : isSwapRetryError || isFirstBuyError
                ? messages.errors.firstBuyFailed
                : undefined
          }
          submitButtonText={isFirstBuyError ? 'Continue' : undefined}
        />
      </Form>
    </Formik>
  )
}
