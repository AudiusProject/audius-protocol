import { useEffect, useRef } from 'react'

import { musicConfettiActions } from '@audius/common/store'
import { route } from '@audius/common/utils'
import {
  Artwork,
  Button,
  Flex,
  Hint,
  IconInfo,
  IconShare,
  IconX,
  LoadingSpinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  Paper,
  Text,
  TextLink
} from '@audius/harmony'
import { useFormikContext } from 'formik'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom-v5-compat'

import { AddressTile } from 'components/address-tile'
import ConnectedMusicConfetti from 'components/music-confetti/ConnectedMusicConfetti'
import { LaunchCoinErrorMetadata } from 'hooks/useLaunchCoin'

import { SetupFormValues } from './types'

const messages = {
  awaitingConfirmation: 'Awaiting Confirmation',
  launchingCoinDescription: (numTxs: number) =>
    `You have ${numTxs} transactions to sign. Please don't close this page.`,
  congratsTitle: '🎉 Congrats!',
  title: 'Create Your Artist Coin',
  congratsDescription:
    'Congrats on launching your artist coin on Audius! Time to share the good news with your fans.',
  purchaseSummary: 'Purchase Summary',
  address: 'Coin Address',
  addressTitle: 'Coin Address',
  shareToX: 'Share To X',
  uploadCoinGatedTrack: 'Upload Coin Gated Track',
  copyAddress: 'Copy Address',
  viewOnExplorer: 'View on Solscan',
  insufficientBalanceTitle: 'Check your wallet balance',
  insufficientBalanceDescription:
    "You'll need to add funds to your wallet before you can continue.",
  solAmount: '0.03 SOL',
  solDescription: ' — required to create your coin',
  audioDescription:
    '• Extra AUDIO if you want to make an initial buy of your coin (optional).',
  hintText:
    'Add SOL to your connected wallet, or send AUDIO from your Audius wallet',
  learnHowToFund: 'Learn how to fund your wallet',
  sendAudio: 'Send AUDIO',
  errorMessages: {
    notInAudiusBody:
      'It’s live on the blockchain but not showing in Audius yet. Use the address below to view it and check back later once it’s connected.',
    yourCoinIsLive: 'YOUR COIN IS LIVE! 🎉',
    unknownErrorDescription: (coinLaunched: boolean) =>
      `Something unexpected went wrong ${coinLaunched ? 'but your coin is live on the blockchain' : ''}`,
    unknownErrorTitle: 'Something went wrong'
  }
}

const LoadingState = ({ numTxs }: { numTxs: number }) => (
  <ModalContent>
    <Flex
      column
      alignItems='center'
      justifyContent='center'
      gap='xl'
      css={{
        minHeight: 600,
        minWidth: 720
      }}
    >
      <LoadingSpinner size='3xl' />
      <Flex column gap='s' alignItems='center'>
        <Text variant='heading' size='l'>
          {messages.awaitingConfirmation}
        </Text>
        <Text variant='body' size='l'>
          {messages.launchingCoinDescription(numTxs)}
        </Text>
      </Flex>
    </Flex>
  </ModalContent>
)

const SuccessState = ({
  coin
}: {
  coin: {
    mint?: string
    name?: string
    ticker?: string
    logoUri?: string
    amountUi: string
    amountUsd: string
  }
}) => {
  const { mint, name, ticker, logoUri, amountUi, amountUsd } = coin

  const dispatch = useDispatch()
  const hasShownConfettiRef = useRef(false)

  useEffect(() => {
    if (!hasShownConfettiRef.current) {
      dispatch(musicConfettiActions.show())
      hasShownConfettiRef.current = true
    }
  }, [dispatch])

  const navigate = useNavigate()

  const handleUploadCoinGatedTrack = () => {
    navigate(route.UPLOAD_PAGE)
  }

  const handleShareToX = () => {
    const shareText = `My artist coin $${ticker} is live on @AudiusProject. Be the first to buy and unlock my exclusive fan club:`
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
    window.open(shareUrl, '_blank')
  }

  return (
    <>
      <ConnectedMusicConfetti />
      <ModalHeader showDismissButton>
        <ModalTitle title={messages.congratsTitle} />
      </ModalHeader>
      <ModalContent>
        <Flex column gap='2xl' w='100%'>
          {/* Congratulatory Message */}
          <Text variant='body' size='l' color='default'>
            {messages.congratsDescription}
          </Text>

          {/* Purchase Summary */}
          <Flex column gap='m' w='100%'>
            <Text variant='label' size='l' color='subdued'>
              {messages.purchaseSummary}
            </Text>
            <Paper
              p='m'
              gap='m'
              w='100%'
              borderRadius='s'
              border='default'
              backgroundColor='surface1'
            >
              <Flex alignItems='center' gap='m' w='100%'>
                <Artwork src={logoUri} w='48px' h='48px' hex borderWidth={0} />

                <Flex column gap='xs' flex={1}>
                  <Text variant='title' size='m' color='default'>
                    {name}
                  </Text>
                  <Flex
                    alignItems='center'
                    justifyContent='space-between'
                    w='100%'
                  >
                    <Text variant='title' size='s' strength='weak'>
                      {amountUi} <Text color='subdued'>${ticker}</Text>
                    </Text>
                    <Text variant='title' size='s' strength='weak'>
                      ${amountUsd}
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
            </Paper>
          </Flex>

          {/* Contract Address Section */}
          <Flex column gap='m' w='100%'>
            <Text variant='label' size='l' color='subdued'>
              {messages.addressTitle}
            </Text>
            <AddressTile address={mint} />
          </Flex>

          {/* Action Buttons */}
          <Flex column gap='s' w='100%'>
            <Button
              variant='primary'
              fullWidth
              onClick={handleUploadCoinGatedTrack}
              iconLeft={IconShare}
            >
              {messages.uploadCoinGatedTrack}
            </Button>

            <Button
              variant='secondary'
              fullWidth
              onClick={handleShareToX}
              iconLeft={IconX}
            >
              {messages.shareToX}
            </Button>
          </Flex>
        </Flex>
      </ModalContent>
    </>
  )
}

/**
 * Rare edge case modal where the SDK call to add the coin to Audius fails
 */
const CoinNotInAudiusState = ({
  onClose,
  mintAddress
}: {
  onClose: () => void
  mintAddress: string
}) => (
  <>
    <ModalHeader onClose={onClose}>
      <ModalTitle title={messages.errorMessages.yourCoinIsLive} />
    </ModalHeader>
    <ModalContent>
      <Flex column gap='2xl'>
        <Text variant='body' size='l' color='default'>
          {messages.errorMessages.notInAudiusBody}
        </Text>
        <Flex column gap='s'>
          <Text variant='label' size='l' color='subdued'>
            {messages.addressTitle}
          </Text>
          <AddressTile address={mintAddress} />
        </Flex>
      </Flex>
    </ModalContent>
  </>
)

/**
 * Rare edge case modal where an uncaught error crashed the tan-query useLaunchCoin mutation
 */
const UnknownErrorState = ({
  errorMetadata,
  mintAddress,
  onClose
}: {
  errorMetadata?: LaunchCoinErrorMetadata
  mintAddress: string | undefined
  onClose: () => void
}) => {
  return (
    <>
      <ModalHeader onClose={onClose}>
        <ModalTitle title={messages.errorMessages.unknownErrorTitle} />
      </ModalHeader>
      <ModalContent>
        <Flex column gap='2xl'>
          <Text variant='body' size='l' color='default'>
            {messages.errorMessages.unknownErrorDescription(
              errorMetadata?.poolCreateConfirmed ?? false
            )}
          </Text>
          {mintAddress ? (
            <Flex column gap='s'>
              <Text variant='label' size='l' color='subdued'>
                {messages.addressTitle}
              </Text>
              <AddressTile address={mintAddress} />
            </Flex>
          ) : null}
        </Flex>
      </ModalContent>
    </>
  )
}

const ErrorState = ({
  errorMetadata,
  mintAddress,
  onClose
}: {
  errorMetadata?: LaunchCoinErrorMetadata
  mintAddress: string | undefined
  onClose: () => void
}) => {
  if (errorMetadata?.poolCreateConfirmed && mintAddress) {
    return <CoinNotInAudiusState onClose={onClose} mintAddress={mintAddress} />
  }
  return (
    <UnknownErrorState
      errorMetadata={errorMetadata}
      mintAddress={mintAddress}
      onClose={onClose}
    />
  )
}

export const LaunchpadSubmitModal = ({
  isPending,
  isSuccess,
  isError,
  isOpen,
  onClose,
  mintAddress,
  logoUri,
  errorMetadata
}: {
  isPending: boolean
  isSuccess: boolean
  isError: boolean
  isOpen: boolean
  onClose: () => void
  mintAddress: string | undefined
  logoUri: string | undefined
  errorMetadata?: LaunchCoinErrorMetadata
}) => {
  const { values } = useFormikContext<SetupFormValues>()
  const { coinName, coinSymbol, receiveAmount, payAmount } = values
  const coin = {
    mint: mintAddress || errorMetadata?.coinMetadata?.mint,
    name: coinName,
    ticker: coinSymbol,
    logoUri,
    amountUi: receiveAmount,
    amountUsd: receiveAmount
  }
  const numTxs = payAmount ? 2 : 1
  return (
    <Modal
      isOpen={isOpen}
      size={isSuccess || isError ? 'small' : undefined}
      onClose={() => {
        if (isSuccess || isError) {
          onClose()
        }
      }}
    >
      {isPending ? <LoadingState numTxs={numTxs} /> : null}
      {isSuccess ? <SuccessState coin={coin} /> : null}
      {isError ? (
        <ErrorState
          errorMetadata={errorMetadata}
          mintAddress={coin.mint}
          onClose={onClose}
        />
      ) : null}
    </Modal>
  )
}

export const InsufficientBalanceModal = ({
  isOpen,
  onClose
}: {
  isOpen: boolean
  onClose: () => void
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader showDismissButton>
          <Flex justifyContent='center'>
            <Text variant='label' size='xl' strength='strong'>
              {messages.insufficientBalanceTitle}
            </Text>
          </Flex>
        </ModalHeader>
        <Flex column gap='xl' pt='xl'>
          <Text variant='body' size='l' color='default'>
            {messages.insufficientBalanceDescription}
          </Text>

          <Flex column gap='l'>
            <Flex column gap='s'>
              <Text variant='body' size='l'>
                {'• '}
                <Text variant='body' size='l' strength='strong'>
                  {messages.solAmount}
                </Text>
                {messages.solDescription}
              </Text>
              <Text variant='body' size='l'>
                {messages.audioDescription}
              </Text>
            </Flex>
          </Flex>

          <Hint icon={IconInfo}>
            <Flex gap='m' column>
              <Text>{messages.hintText}</Text>
              <Flex gap='m'>
                <TextLink
                  showUnderline
                  onClick={() => {
                    /* TODO: DESIGN TO PROVIDE LINK */
                  }}
                >
                  {messages.learnHowToFund}
                </TextLink>
                <TextLink
                  showUnderline
                  onClick={() => {
                    /* TODO: DESIGN TO PROVIDE LINK */
                  }}
                  css={({ color }) => ({ color: color.icon.default })}
                >
                  {messages.sendAudio}
                </TextLink>
              </Flex>
            </Flex>
          </Hint>
        </Flex>
      </ModalContent>
    </Modal>
  )
}
