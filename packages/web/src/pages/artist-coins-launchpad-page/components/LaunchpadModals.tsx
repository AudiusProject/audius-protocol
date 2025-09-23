import { useSendTokensModal } from '@audius/common/store'
import {
  Flex,
  Hint,
  IconInfo,
  LoadingSpinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  Text,
  TextLink
} from '@audius/harmony'
import { useFormikContext } from 'formik'

import { AddressTile } from 'components/address-tile'
import { LaunchCoinErrorMetadata } from 'hooks/useLaunchCoin'
import { env } from 'services/env'

import { SetupFormValues } from './types'

const messages = {
  awaitingConfirmation: 'Awaiting Confirmation',
  launchingCoinDescription: (numTxs: number) =>
    `You have ${numTxs} transactions to sign. Please don't close this page.`,
  addressTitle: 'Coin Address',
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
      "It's live on the blockchain but not showing in Audius yet. Use the address below to view it and check back later once it's connected.",
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
  isError,
  isOpen,
  onClose,
  mintAddress,
  errorMetadata
}: {
  isPending: boolean
  isError: boolean
  isOpen: boolean
  onClose: () => void
  mintAddress: string | undefined
  errorMetadata?: LaunchCoinErrorMetadata
}) => {
  const { values } = useFormikContext<SetupFormValues>()
  const { payAmount } = values
  const numTxs = payAmount ? 2 : 1
  return (
    <Modal
      isOpen={isOpen}
      size={isError ? 'small' : undefined}
      onClose={() => {
        if (isError) {
          onClose()
        }
      }}
    >
      {isPending ? <LoadingState numTxs={numTxs} /> : null}
      {isError ? (
        <ErrorState
          errorMetadata={errorMetadata}
          mintAddress={mintAddress || errorMetadata?.coinMetadata?.mint}
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
  const { onOpen: openSendTokensModal } = useSendTokensModal()

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='small'>
      <ModalHeader showDismissButton>
        <Flex justifyContent='center'>
          <Text variant='label' size='xl' strength='strong'>
            {messages.insufficientBalanceTitle}
          </Text>
        </Flex>
      </ModalHeader>
      <ModalContent>
        <Flex column gap='xl'>
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
                    openSendTokensModal({
                      mint: env.WAUDIO_MINT_ADDRESS,
                      isOpen: true
                    })
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
