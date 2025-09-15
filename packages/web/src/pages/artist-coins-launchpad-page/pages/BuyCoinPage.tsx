import { useMemo, useCallback, useState } from 'react'

import { useConnectedWallets, type ConnectedWallet } from '@audius/common/api'
import { useDebouncedCallback } from '@audius/common/hooks'
import { Chain } from '@audius/common/models'
import { formatNumberCommas, shortenSPLAddress } from '@audius/common/utils'
import { FixedDecimal } from '@audius/fixed-decimal'
import {
  Artwork,
  Flex,
  Hint,
  IconLogoCircleSOL,
  Paper,
  Text,
  TokenAmountInput
} from '@audius/harmony'
import { useFormikContext } from 'formik'

import { useFormImageUrl } from 'hooks/useFormImageUrl'
import { audiusSdk } from 'services/audius-sdk/audiusSdk'

import { ArtistCoinsSubmitRow } from '../components/ArtistCoinsSubmitRow'
import type { PhasePageProps, SetupFormValues } from '../components/types'
import {
  AMOUNT_OF_STEPS,
  SOLANA_DECIMALS,
  TOKEN_DECIMALS,
  USDC_DECIMALS
} from '../constants'

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
  rateValue: (exchangeRate: number) =>
    `1 SOL ≈ ${formatNumberCommas(exchangeRate.toFixed(0))}`,
  valueInUSDC: 'Value',
  hintMessage:
    "Buying an amount now makes sure you can get in at the lowest price before others beat you to it. You'll still receive your vested coins over time after your coin reaches a graduation market cap.",
  back: 'Back'
}

export const BuyCoinPage = ({ onContinue, onBack }: PhasePageProps) => {
  // Use Formik context to manage form state, including payAmount and receiveAmount
  const { values, setFieldValue } = useFormikContext<SetupFormValues>()
  const [usdcQuoteValue, setUsdcQuoteValue] = useState<string | null>(null)
  const imageUrl = useFormImageUrl(values.coinImage)

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

  // Debounced function to call the SDK getFirstBuyQuote method
  const debouncedGetFirstBuyQuote = useDebouncedCallback(
    async (payValue: number) => {
      if (payValue > 0) {
        try {
          const sdk = await audiusSdk()
          const solAmountLamports = Number(
            new FixedDecimal(payValue, SOLANA_DECIMALS).trunc(SOLANA_DECIMALS)
              .value
          )
          const firstBuyQuoteRes =
            await sdk.services.solanaRelay.getFirstBuyQuote(solAmountLamports)

          const usdcAmountFD = new FixedDecimal(
            BigInt(firstBuyQuoteRes.usdcInputAmount),
            USDC_DECIMALS
          )
          const usdcAmountUiString = usdcAmountFD.toLocaleString('en-US', {
            maximumFractionDigits: 2,
            roundingMode: 'trunc'
          })
          setUsdcQuoteValue(usdcAmountUiString)

          // The value is returned in bigint format, we need to format it to a user friendly format using FixedDecimal
          const tokenAmountFD = new FixedDecimal(
            BigInt(firstBuyQuoteRes.tokenOutputAmount),
            TOKEN_DECIMALS
          )
          const tokenAmountUiString = tokenAmountFD.toLocaleString('en-US', {
            maximumFractionDigits: 0,
            roundingMode: 'trunc'
          })

          setFieldValue('receiveAmount', tokenAmountUiString)
        } catch (error) {
          console.error('Error getting first buy quote:', error)
        }
      } else {
        setFieldValue('receiveAmount', undefined)
      }
    },
    [setFieldValue],
    300
  )

  const handlePayAmountChange = useCallback(
    async (value: string, _valueBigInt: bigint) => {
      setFieldValue('payAmount', value)
      const payValue = parseFloat(value) ?? 0

      // Call debounced API function
      debouncedGetFirstBuyQuote(payValue)
    },
    [setFieldValue, debouncedGetFirstBuyQuote]
  )

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
                  css={(theme) => ({
                    color:
                      theme.type === 'day'
                        ? theme.color.text.staticWhite
                        : theme.color.text.white
                  })}
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
                    pl='xs'
                    pr='s'
                    pv='xs'
                    backgroundColor='surface2'
                    border='default'
                    borderRadius='xl'
                  >
                    <Flex
                      alignItems='center'
                      justifyContent='center'
                      w='xl'
                      h='xl'
                      borderRadius='circle'
                      backgroundColor='accent'
                    >
                      <IconLogoCircleSOL size='l' />
                    </Flex>
                    <Text
                      variant='title'
                      size='m'
                      strength='weak'
                      color='default'
                    >
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

            {/* USDC Value quote */}
            <Flex w='100%' alignItems='center' gap='xs'>
              <Text variant='body' size='m' color='subdued'>
                {messages.valueInUSDC}
              </Text>
              <Text variant='body' size='m' color='default'>
                ${usdcQuoteValue ?? '0.00'}
              </Text>
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
        submit
      />
    </>
  )
}
