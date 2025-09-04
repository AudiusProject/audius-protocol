import { useMemo } from 'react'

import { useConnectedWallets, type ConnectedWallet } from '@audius/common/api'
import { Chain } from '@audius/common/models'
import { shortenSPLAddress } from '@audius/common/utils'
import {
  Artwork,
  Flex,
  Hint,
  IconLogoCircleSOL,
  Paper,
  Text,
  TokenAmountInput,
  useTheme
} from '@audius/harmony'
import { useFormikContext } from 'formik'

import { useFormImageUrl } from 'hooks/useFormImageUrl'

import { AMOUNT_OF_STEPS } from '../constants'

import { ArtistCoinsSubmitRow } from './ArtistCoinsSubmitRow'
import type { PhasePageProps, SetupFormValues } from './types'

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

export const BuyCoinPage = ({ onContinue, onBack }: PhasePageProps) => {
  // Use Formik context to manage form state, including payAmount and receiveAmount
  const { values, setFieldValue } = useFormikContext<SetupFormValues>()
  const imageUrl = useFormImageUrl(values.coinImage)
  const { spacing } = useTheme()

  const { data: connectedWallets } = useConnectedWallets()

  // Get the most recent connected Solana wallet (last in the array)
  // Filter to only Solana wallets since only SOL wallets can be connected
  const connectedWallet: ConnectedWallet | undefined = useMemo(
    () => connectedWallets?.filter((wallet) => wallet.chain === Chain.Sol)?.[0],
    [connectedWallets]
  )

  // Format the wallet address for display (always Solana format)
  const formattedWalletAddress = connectedWallet
    ? shortenSPLAddress(connectedWallet.address)
    : null

  const handleBack = () => {
    onBack?.()
  }

  const handleContinue = () => {
    onContinue?.()
  }

  const handlePayAmountChange = (value: string, _valueBigInt: bigint) => {
    setFieldValue('payAmount', value)
    // Calculate receive amount based on exchange rate
    // For now, using mock calculation
    const payValue = parseFloat(value) ?? 0
    const calculatedReceive = payValue * 0.302183
    setFieldValue('receiveAmount', calculatedReceive.toFixed(6))
  }

  const handleReceiveAmountChange = (value: string, _valueBigInt: bigint) => {
    setFieldValue('receiveAmount', value)
    // Calculate pay amount based on exchange rate
    const receiveValue = parseFloat(value) ?? 0
    const calculatedPay = receiveValue / 0.302183
    setFieldValue('payAmount', calculatedPay.toFixed(6))
  }

  return (
    <>
      <Flex
        direction='column'
        alignItems='center'
        justifyContent='center'
        gap='l'
      >
        <Paper p='2xl' gap='2xl' direction='column' w='100%'>
          <Flex direction='column' gap='xs' alignItems='flex-start'>
            <Text variant='label' size='s' color='subdued'>
              {messages.stepInfo}
            </Text>
            <Flex alignItems='center' gap='s'>
              <Text variant='heading' size='l' color='default'>
                {messages.title}
              </Text>
              <Flex
                alignItems='center'
                justifyContent='center'
                ph='s'
                pv='xs'
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
                value={values.payAmount ?? ''}
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
                value={values.receiveAmount ?? ''}
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
      <ArtistCoinsSubmitRow
        cancelText={messages.back}
        backIcon
        onContinue={handleContinue}
        onBack={handleBack}
      />
    </>
  )
}
