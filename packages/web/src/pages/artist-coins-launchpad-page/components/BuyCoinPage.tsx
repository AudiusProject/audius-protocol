import { useEffect, useState } from 'react'

import { useConnectedWallets } from '@audius/common/api'
import { Chain } from '@audius/common/models'
import { shortenSPLAddress } from '@audius/common/utils'
import {
  Artwork,
  Flex,
  Hint,
  IconLogoCircleSOL,
  Paper,
  Text,
  TokenAmountInput
} from '@audius/harmony'
import { spacing } from '@audius/harmony/src/foundations/spacing/spacing'
import { useFormikContext } from 'formik'

import { AMOUNT_OF_STEPS } from '../constants'

import { ArtistCoinsAnchoredSubmitRow } from './ArtistCoinsAnchoredSubmitRow'
import type { BuyCoinPageProps, SetupFormValues } from './types'

const messages = {
  stepInfo: `STEP 3 of ${AMOUNT_OF_STEPS}`,
  title: 'Buy Your Coin Early',
  optional: 'OPTIONAL',
  description:
    'Before your coin goes live, you have the option to buy some at the lowest price.',
  youPay: 'You Pay',
  youReceive: 'You Receive',
  connectedWallet: 'Connected Wallet',
  rate: 'Rate',
  rateValue: '1 $AUDIO ≈ 0.302183',
  valueInUSDC: 'Value in USDC',
  usdcValue: '$45.56',
  hintMessage:
    "Buying an amount now makes sure you can get in at the lowest price before others beat you to it. You'll still receive your vested coins over time after your coin reaches a graduation market cap.",
  back: 'Back'
}

export const BuyCoinPage = ({ onContinue, onBack }: BuyCoinPageProps) => {
  const { values } = useFormikContext<SetupFormValues>()
  const [payAmount, setPayAmount] = useState('')
  const [receiveAmount, setReceiveAmount] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const { data: connectedWallets } = useConnectedWallets()

  // Get the most recent connected Solana wallet (last in the array)
  // Filter to only Solana wallets since only SOL wallets can be connected
  const connectedWallet = connectedWallets?.filter(
    (wallet) => wallet.chain === Chain.Sol
  )?.[0]

  // Format the wallet address for display (always Solana format)
  const formattedWalletAddress = connectedWallet
    ? shortenSPLAddress(connectedWallet.address)
    : null

  // Create image URL from the coin image stored in Formik
  useEffect(() => {
    if (values.coinImage) {
      const url = URL.createObjectURL(values.coinImage)
      setImageUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [values.coinImage])

  const handleBack = () => {
    onBack?.()
  }

  const handleContinue = () => {
    onContinue?.()
  }

  const handlePayAmountChange = (value: string, _valueBigInt: bigint) => {
    setPayAmount(value)
    // Calculate receive amount based on exchange rate
    // For now, using mock calculation
    const payValue = parseFloat(value) || 0
    const calculatedReceive = payValue * 0.302183
    setReceiveAmount(calculatedReceive.toFixed(6))
  }

  const handleReceiveAmountChange = (value: string, _valueBigInt: bigint) => {
    setReceiveAmount(value)
    // Calculate pay amount based on exchange rate
    const receiveValue = parseFloat(value) || 0
    const calculatedPay = receiveValue / 0.302183
    setPayAmount(calculatedPay.toFixed(6))
  }

  return (
    <>
      <Flex
        direction='column'
        alignItems='center'
        justifyContent='center'
        gap='l'
        pb='unit20'
      >
        <Paper p='2xl' gap='2xl' direction='column' w='100%'>
          <Flex direction='column' gap='xs' alignItems='flex-start'>
            <Text variant='label' size='s' color='subdued'>
              {messages.stepInfo}
            </Text>
            <Flex alignItems='center' gap='xs'>
              <Text variant='heading' size='l' color='default'>
                {messages.title}
              </Text>
              <Flex
                alignItems='center'
                justifyContent='center'
                h={spacing.unit4}
                p='xs'
                backgroundColor='accent'
                borderRadius='l'
              >
                <Text
                  variant='label'
                  size='xs'
                  color='staticWhite'
                  textTransform='uppercase'
                >
                  {messages.optional}
                </Text>
              </Flex>
            </Flex>
            <Text variant='body' size='l' color='subdued'>
              {messages.description}
            </Text>
          </Flex>

          <Flex direction='column' gap='xl'>
            {/* You Pay Section */}
            <Flex direction='column' gap='s'>
              <Flex alignItems='center' justifyContent='space-between' w='100%'>
                <Text variant='heading' size='s' color='default'>
                  {messages.youPay}
                </Text>
                <Flex alignItems='center' gap='s'>
                  <Text variant='body' size='m' color='subdued'>
                    {messages.connectedWallet}
                  </Text>
                  <Flex
                    alignItems='center'
                    gap='xs'
                    p='xs'
                    backgroundColor='surface2'
                    border='default'
                    borderRadius='xl'
                  >
                    <Flex
                      alignItems='center'
                      justifyContent='center'
                      w={spacing.l}
                      h={spacing.l}
                      borderRadius='circle'
                      backgroundColor='accent'
                    >
                      <IconLogoCircleSOL size='s' />
                    </Flex>
                    <Text variant='body' size='m' color='default'>
                      {formattedWalletAddress}
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
              <TokenAmountInput
                label={messages.youPay}
                tokenLabel='SOL'
                decimals={6}
                value={payAmount}
                onChange={handlePayAmountChange}
                placeholder='0.00'
                hideLabel
                endIcon={<IconLogoCircleSOL size='l' />}
              />
            </Flex>

            {/* You Receive Section */}
            <Flex direction='column' gap='s'>
              <Text variant='heading' size='s' color='default'>
                {messages.youReceive}
              </Text>
              <TokenAmountInput
                label={messages.youReceive}
                tokenLabel={`$${values.coinSymbol}`}
                decimals={6}
                value={receiveAmount}
                onChange={handleReceiveAmountChange}
                placeholder='0.00'
                hideLabel
                endIcon={
                  imageUrl ? (
                    <Artwork
                      src={imageUrl}
                      hex={true}
                      w='xl'
                      h='xl'
                      borderWidth={0}
                    />
                  ) : null
                }
              />
            </Flex>

            {/* Exchange Rate Info */}
            <Flex alignItems='center' justifyContent='space-between' w='100%'>
              <Flex alignItems='center' gap='xs'>
                <Text variant='body' size='m' color='subdued'>
                  {messages.rate}
                </Text>
                <Text variant='body' size='m' color='default'>
                  {messages.rateValue} ${values.coinSymbol.toUpperCase()}
                </Text>
              </Flex>
              <Flex alignItems='center' gap='xs'>
                <Text variant='body' size='m' color='subdued'>
                  {messages.valueInUSDC}
                </Text>
                <Text variant='body' size='m' color='default'>
                  {messages.usdcValue}
                </Text>
              </Flex>
            </Flex>
          </Flex>

          <Hint>{messages.hintMessage}</Hint>
        </Paper>
      </Flex>
      <ArtistCoinsAnchoredSubmitRow
        cancelText={messages.back}
        backIcon
        onContinue={handleContinue}
        onBack={handleBack}
      />
    </>
  )
}
