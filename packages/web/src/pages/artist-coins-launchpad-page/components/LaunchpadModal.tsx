import {
  Artwork,
  Button,
  Divider,
  Flex,
  IconCopy,
  IconX,
  LoadingSpinner,
  Modal,
  ModalContent,
  ModalHeader,
  Paper,
  Text,
  useTheme
} from '@audius/harmony'
import { useFormikContext } from 'formik'

import { AddressTile } from 'components/address-tile'

import { SetupFormValues } from './types'

const messages = {
  awaitingConfirmation: 'Awaiting Confirmation',
  launchingCoinDescription:
    "This may take a moment... Please don't close this page.",
  congratsTitle: '🎉 Congrats!',
  title: 'Create Your Artist Coin',
  congratsDescription:
    'Congrats on launching your artist coin on Audius! Time to share the good news with your community of fans.',
  purchaseSummary: 'Purchase Summary',
  contractAddress: 'Contract Address',
  shareToX: 'Share to X'
}

const LoadingState = () => (
  <ModalContent>
    <Flex
      direction='column'
      alignItems='center'
      justifyContent='center'
      gap='xl'
      css={{
        minHeight: 600,
        minWidth: 720
      }}
    >
      <LoadingSpinner size='3xl' />
      <Flex direction='column' gap='s'>
        <Text variant='heading' size='l'>
          {messages.awaitingConfirmation}
        </Text>
        <Text variant='body' size='l'>
          {messages.launchingCoinDescription}
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
  const { mint, name, ticker, logoUri, amountUi, amountUsd } = coin ?? {
    mint: '123',
    name: 'Test',
    ticker: '$TEST',
    logoUri: 'https://www.google.com',
    amountUi: '100',
    amountUsd: '100'
  }

  return (
    <>
      <ModalHeader showDismissButton>
        <Flex justifyContent='center'>
          <Text variant='label' size='xl' color='default' strength='strong'>
            {messages.congratsTitle}
          </Text>
        </Flex>
      </ModalHeader>
      <ModalContent>
        <Flex
          direction='column'
          alignItems='center'
          justifyContent='center'
          gap='2xl'
        >
          {/* Congratulatory Message */}
          <Text variant='body' size='l' color='default'>
            {messages.congratsDescription}
          </Text>

          {/* Purchase Summary */}
          <Flex direction='column' gap='m' w='100%'>
            <Text
              variant='label'
              size='s'
              color='subdued'
              css={{ textTransform: 'uppercase' }}
            >
              {messages.purchaseSummary}
            </Text>
            <Paper
              p='l'
              gap='l'
              direction='column'
              w='100%'
              borderRadius='m'
              border='default'
              backgroundColor='surface1'
              css={{
                boxShadow: 'none'
              }}
            >
              <Flex alignItems='center' gap='m' w='100%'>
                {/* Token Icon Placeholder */}
                <Artwork src={logoUri} w='48px' h='48px' hex borderWidth={0} />

                <Flex direction='column' gap='xs' flex={1}>
                  <Text variant='title' size='m' color='default'>
                    {name}
                  </Text>
                  <Flex
                    alignItems='center'
                    justifyContent='space-between'
                    w='100%'
                  >
                    <Flex alignItems='center' gap='xs'>
                      <Text variant='body' size='s' color='default'>
                        {amountUi}
                      </Text>
                      <Text variant='body' size='s' color='subdued'>
                        {ticker}
                      </Text>
                    </Flex>
                    <Text variant='body' size='s' color='default'>
                      ${amountUsd}
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
            </Paper>
          </Flex>

          {/* Contract Address */}
          <Flex direction='column' gap='m' w='100%'>
            <Text
              variant='label'
              size='s'
              color='subdued'
              css={{ textTransform: 'uppercase' }}
            >
              {messages.contractAddress}
            </Text>
            <AddressTile address={'12301231239'} />
          </Flex>

          {/* X Share Button */}
          <Button
            variant='secondary'
            fullWidth
            onClick={() => {
              // TODO: Implement share to X
            }}
            iconLeft={IconX}
          >
            {messages.shareToX}
          </Button>
        </Flex>
      </ModalContent>
    </>
  )
}

const ErrorState = () => <ModalContent>TODO: error state</ModalContent>

export const LaunchpadModal = ({
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
  const { coinName, coinSymbol, receiveAmount } = values as SetupFormValues
  const coin = {
    mint: mintAddress,
    name: coinName,
    ticker: coinSymbol,
    logoUri,
    amountUi: receiveAmount,
    amountUsd: receiveAmount
  }
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (isSuccess || isError) {
          onClose()
        }
      }}
    >
      {isPending ? <LoadingState /> : null}
      {isSuccess ? <SuccessState coin={coin} /> : null}
      {isError ? <ErrorState /> : null}
    </Modal>
  )
}
