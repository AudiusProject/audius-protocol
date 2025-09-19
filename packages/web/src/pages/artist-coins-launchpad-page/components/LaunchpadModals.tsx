import { useEffect, useMemo, useRef, useState } from 'react'

import { musicConfettiActions } from '@audius/common/store'
import { FixedDecimal } from '@audius/fixed-decimal'
import {
  Artwork,
  Button,
  Flex,
  Hint,
  IconCheck,
  IconCopy,
  IconInfo,
  IconRocket,
  IconShare,
  IconX,
  LoadingSpinner,
  Modal,
  ModalContent,
  ModalHeader,
  Paper,
  PlainButton,
  Text,
  TextLink
} from '@audius/harmony'
import { useFormikContext } from 'formik'
import { useDispatch } from 'react-redux'

import { AddressTile } from 'components/address-tile'
import ConnectedMusicConfetti from 'components/music-confetti/ConnectedMusicConfetti'

import { SOLANA_DECIMALS } from '../constants'

import { SetupFormValues } from './types'

const messages = {
  awaitingConfirmation: 'Awaiting Confirmation',
  launchingCoinDescription: (numTxs: number) =>
    `You have ${numTxs} transactions to sign. Please don't close this page.`,
  congratsTitle: '🎉 Your Artist Coin is Live!',
  title: 'Create Your Artist Coin',
  congratsDescription:
    'Congratulations! Your artist coin has been successfully created and is now live on Audius.',
  purchaseSummary: 'Purchase Summary',
  address: 'Coin Address',
  addressTitle: 'Contract Address',
  shareToX: 'Share on X',
  copyAddress: 'Copy Address',
  viewOnExplorer: 'View on Solscan',
  insufficientBalanceTitle: 'Check your wallet balance',
  insufficientBalanceDescription:
    "You'll need to add funds to your wallet before you can continue.",
  solAmount: '0.02 SOL',
  solDescription: ' — required to create your coin',
  audioDescription:
    '• Extra AUDIO if you want to make an initial buy of your coin (optional).',
  hintText:
    'Add SOL to your connected wallet, or send AUDIO from your Audius wallet',
  learnHowToFund: 'Learn how to fund your wallet',
  sendAudio: 'Send AUDIO',
  successSubtitle: 'Your coin is now available for trading and discovery',
  nextSteps: 'Next Steps',
  shareWithFans: 'Share with your fans',
  exploreFeatures: 'Explore coin features'
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
  const [copied, setCopied] = useState(false)

  const dispatch = useDispatch()
  const hasShownConfettiRef = useRef(false)

  useEffect(() => {
    if (!hasShownConfettiRef.current) {
      dispatch(musicConfettiActions.show())
      hasShownConfettiRef.current = true
    }
  }, [dispatch])

  const handleCopyAddress = async () => {
    if (mint) {
      try {
        await navigator.clipboard.writeText(mint)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy address:', err)
      }
    }
  }

  const handleShareToX = () => {
    const shareText = `🎉 Just launched my artist coin ${name} ($${ticker}) on @AudiusProject! Check it out:`
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
    window.open(shareUrl, '_blank')
  }

  const handleViewOnExplorer = () => {
    if (mint) {
      window.open(`https://solscan.io/token/${mint}`, '_blank')
    }
  }

  return (
    <>
      <ConnectedMusicConfetti />
      <ModalHeader showDismissButton>
        <Flex justifyContent='center' alignItems='center' gap='s'>
          <IconRocket color='success' />
          <Text variant='label' size='xl' color='default' strength='strong'>
            {messages.congratsTitle}
          </Text>
        </Flex>
      </ModalHeader>
      <ModalContent>
        <Flex column alignItems='center' justifyContent='center' gap='2xl'>
          {/* Success Message */}
          <Flex column alignItems='center' gap='m'>
            <Text variant='body' size='l' color='default' textAlign='center'>
              {messages.congratsDescription}
            </Text>
            <Text variant='body' size='m' color='subdued' textAlign='center'>
              {messages.successSubtitle}
            </Text>
          </Flex>

          {/* Coin Summary Card */}
          <Paper
            p='xl'
            gap='l'
            column
            w='100%'
            borderRadius='l'
            border='strong'
            backgroundColor='surface1'
            css={{
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Flex alignItems='center' gap='l' w='100%'>
              <Artwork src={logoUri} w='64px' h='64px' hex borderWidth={0} />
              
              <Flex column gap='s' flex={1}>
                <Text variant='title' size='l' color='default'>
                  {name}
                </Text>
                <Text variant='body' size='m' color='subdued'>
                  ${ticker}
                </Text>
                <Flex alignItems='center' gap='xs'>
                  <IconCheck color='success' />
                  <Text variant='body' size='s' color='success'>
                    Successfully Created
                  </Text>
                </Flex>
              </Flex>
              
              <Flex column alignItems='flex-end' gap='xs'>
                <Text variant='title' size='m' color='default'>
                  {amountUi}
                </Text>
                <Text variant='body' size='s' color='subdued'>
                  ${amountUsd}
                </Text>
              </Flex>
            </Flex>
          </Paper>

          {/* Contract Address Section */}
          <Flex column gap='m' w='100%'>
            <Text
              variant='label'
              size='s'
              color='subdued'
              css={{ textTransform: 'uppercase' }}
            >
              {messages.addressTitle}
            </Text>
            <Flex alignItems='center' gap='s' w='100%'>
              <AddressTile address={mint} />
              <PlainButton
                onClick={handleCopyAddress}
                iconLeft={copied ? IconCheck : IconCopy}
                color={copied ? 'success' : 'default'}
                size='small'
              >
                {copied ? 'Copied!' : messages.copyAddress}
              </PlainButton>
            </Flex>
          </Flex>

          {/* Action Buttons */}
          <Flex column gap='m' w='100%'>
            <Button
              variant='primary'
              fullWidth
              onClick={handleShareToX}
              iconLeft={IconX}
            >
              {messages.shareToX}
            </Button>
            
            <Button
              variant='secondary'
              fullWidth
              onClick={handleViewOnExplorer}
              iconLeft={IconShare}
            >
              {messages.viewOnExplorer}
            </Button>
          </Flex>

          {/* Next Steps */}
          <Flex column gap='m' w='100%'>
            <Text
              variant='label'
              size='s'
              color='subdued'
              css={{ textTransform: 'uppercase' }}
            >
              {messages.nextSteps}
            </Text>
            <Flex column gap='s'>
              <Text variant='body' size='s' color='default'>
                • {messages.shareWithFans}
              </Text>
              <Text variant='body' size='s' color='default'>
                • {messages.exploreFeatures}
              </Text>
            </Flex>
          </Flex>
        </Flex>
      </ModalContent>
    </>
  )
}

const ErrorState = () => <ModalContent>TODO: error state</ModalContent>

export const LaunchpadSubmitModal = ({
  isPending,
  isSuccess,
  isError,
  isOpen,
  onClose,
  mintAddress,
  logoUri
}: {
  isPending: boolean
  isSuccess: boolean
  isError: boolean
  isOpen: boolean
  onClose: () => void
  mintAddress: string | undefined
  logoUri: string | undefined
}) => {
  const { values } = useFormikContext()
  const { coinName, coinSymbol, receiveAmount, payAmount } =
    values as SetupFormValues
  const coin = {
    mint: mintAddress,
    name: coinName,
    ticker: coinSymbol,
    logoUri,
    amountUi: receiveAmount,
    amountUsd: receiveAmount
  }
  const payAmountParsed = useMemo(
    () =>
      payAmount
        ? new FixedDecimal(payAmount?.replace(',', ''), SOLANA_DECIMALS).value
        : 0,
    [payAmount]
  )
  const numTxs = payAmount && payAmountParsed > 0 ? 3 : 1
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (isSuccess || isError) {
          onClose()
        }
      }}
    >
      {isPending ? <LoadingState numTxs={numTxs} /> : null}
      {isSuccess ? <SuccessState coin={coin} /> : null}
      {isError ? <ErrorState /> : null}
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
