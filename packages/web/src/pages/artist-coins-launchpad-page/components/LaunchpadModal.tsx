import { useMemo } from 'react'

import { FixedDecimal } from '@audius/fixed-decimal'
import {
  Artwork,
  Button,
  Flex,
  IconX,
  LoadingSpinner,
  Modal,
  ModalContent,
  ModalHeader,
  Paper,
  Text
} from '@audius/harmony'
import { useFormikContext } from 'formik'

import { AddressTile } from 'components/address-tile'

import { SOLANA_DECIMALS } from '../constants'

import { SetupFormValues } from './types'

const messages = {
  awaitingConfirmation: 'Awaiting Confirmation',
  launchingCoinDescription: (numTxs: number) =>
    `You have ${numTxs} transactions to sign. Please don't close this page.`,
  congratsTitle: '🎉 Congrats!',
  title: 'Create Your Artist Coin',
  congratsDescription:
    'Congrats on launching your artist coin on Audius! Time to share the good news with your community of fans.',
  purchaseSummary: 'Purchase Summary',
  address: 'Coin Address',
  addressTitle: 'Coin Address',
  shareToX: 'Share to X'
}

const LoadingState = ({ numTxs }: { numTxs: number }) => (
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
      <Flex direction='column' gap='s' alignItems='center'>
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
              {messages.addressTitle}
            </Text>
            <AddressTile address={mint} />
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
    () => (payAmount ? new FixedDecimal(payAmount, SOLANA_DECIMALS).value : 0),
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
