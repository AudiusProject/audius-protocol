import { useMemo, useCallback, useEffect, useState } from 'react'

import {
  useConnectedWallets,
  useFirstBuyQuote,
  type ConnectedWallet
} from '@audius/common/api'
import { useDebouncedCallback } from '@audius/common/hooks'
import { Chain } from '@audius/common/models'
import { shortenSPLAddress } from '@audius/common/utils'
import {
  Artwork,
  Flex,
  Hint,
  IconLogoCircleSOL,
  LoadingSpinner,
  Paper,
  Text,
  TokenAmountInput
} from '@audius/harmony'
import { useFormikContext } from 'formik'

import { useFormImageUrl } from 'hooks/useFormImageUrl'

import { ArtistCoinsSubmitRow } from '../components/ArtistCoinsSubmitRow'
import type { PhasePageProps, SetupFormValues } from '../components/types'
import { AMOUNT_OF_STEPS } from '../constants'

const messages = {
  stepInfo: `STEP 3 of ${AMOUNT_OF_STEPS}`,
  title: 'Buy Your Coin Early',
  optional: 'OPTIONAL',
  description:
    'Before your coin goes live, you have the option to buy some at the lowest price.',
  youPay: 'You Pay',
  youReceive: 'You Receive',
  valueInUSDC: 'Value',
  hintMessage:
    "Buying an amount now makes sure you can get in at the lowest price before others beat you to it. You'll still receive your vested coins over time after your coin reaches a graduation market cap.",
  back: 'Back',
  errors: {
    quoteError: 'Failed to get a quote. Please try again.',
    valueTooHigh: 'Value is too high. Please enter a lower value.'
  }
}

// TODO (PE-6839): improve how we handle this value, this value fluctuates based on the SOL-AUDIO exchange rate
const MAX_SOL_AMOUNT = 60 // The max amount of SOL

// This number never changes with our pool configs - this number is the max amount of tokens that can be bought out of the pool before graduation triggers
const MAX_TOKEN_AMOUNT = 249658688

const INPUT_DEBOUNCE_TIME = 300

export const BuyCoinPage = ({ onContinue, onBack }: PhasePageProps) => {
  // Use Formik context to manage form state, including payAmount and receiveAmount
  const { values, setFieldValue } = useFormikContext<SetupFormValues>()
  const [isPayAmountChanging, setIsPayAmountChanging] = useState(false)
  const [isReceiveAmountChanging, setIsReceiveAmountChanging] = useState(false)

  const imageUrl = useFormImageUrl(values.coinImage)

  const { data: connectedWallets } = useConnectedWallets()

  // Get the most recent connected Solana wallet (last in the array)
  // Filter to only Solana wallets since only SOL wallets can be connected
  const connectedWallet: ConnectedWallet | undefined = useMemo(
    () => connectedWallets?.filter((wallet) => wallet.chain === Chain.Sol)?.[0],
    [connectedWallets]
  )

  // Get the first buy quote using the hook
  const {
    data: firstBuyQuoteData,
    mutate: getFirstBuyQuote,
    isPending: isFirstBuyQuotePending,
    error: firstBuyQuoteError
  } = useFirstBuyQuote()

  // Resets inputs from disabled when the api call is not pending
  useEffect(() => {
    if (!isFirstBuyQuotePending) {
      setIsPayAmountChanging(false)
      setIsReceiveAmountChanging(false)
    }
  }, [isFirstBuyQuotePending])

  // When quote comes back, update our inputs with the new values
  useEffect(() => {
    if (firstBuyQuoteData) {
      setFieldValue('receiveAmount', firstBuyQuoteData.tokenAmountUiString)
      setFieldValue('payAmount', firstBuyQuoteData.solAmountUiString)
    }
  }, [firstBuyQuoteData, setFieldValue])

  const formattedWalletAddress = connectedWallet
    ? shortenSPLAddress(connectedWallet.address)
    : null

  const handleBack = () => {
    onBack?.()
  }

  const handleContinue = () => {
    onContinue?.()
  }

  const debouncedPayAmountChange = useDebouncedCallback(
    (payAmount: string) => {
      if (payAmount && Number(payAmount) <= MAX_SOL_AMOUNT) {
        setIsReceiveAmountChanging(true)
        getFirstBuyQuote({ solUiInputAmount: payAmount })
      }
    },
    [getFirstBuyQuote],
    INPUT_DEBOUNCE_TIME
  )

  const debouncedReceiveAmountChange = useDebouncedCallback(
    (receiveAmount: string) => {
      if (receiveAmount && Number(receiveAmount) <= MAX_TOKEN_AMOUNT) {
        setIsPayAmountChanging(true)
        getFirstBuyQuote({ tokenUiOutputAmount: receiveAmount })
      }
    },
    [getFirstBuyQuote],
    INPUT_DEBOUNCE_TIME
  )

  const handlePayAmountChange = useCallback(
    async (value: string, _valueBigInt: bigint) => {
      setFieldValue('payAmount', value)
      debouncedPayAmountChange(value)
    },
    [setFieldValue, debouncedPayAmountChange]
  )

  const handleReceiveAmountChange = useCallback(
    (value: string, _valueBigInt: bigint) => {
      setFieldValue('receiveAmount', value)
      debouncedReceiveAmountChange(value)
    },
    [setFieldValue, debouncedReceiveAmountChange]
  )

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
              </Flex>
              <TokenAmountInput
                label={messages.youPay}
                tokenLabel='SOL'
                decimals={6}
                value={values.payAmount ?? ''}
                onChange={handlePayAmountChange}
                placeholder='0.00'
                hideLabel
                helperText={
                  values.payAmount && Number(values.payAmount) > MAX_SOL_AMOUNT
                    ? messages.errors.valueTooHigh
                    : undefined
                }
                error={
                  !!values.payAmount &&
                  Number(values.payAmount) > MAX_SOL_AMOUNT
                }
                disabled={isPayAmountChanging}
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
                disabled={isReceiveAmountChanging}
                startAdornmentText='~'
                helperText={
                  values.receiveAmount &&
                  Number(values.receiveAmount) > MAX_TOKEN_AMOUNT
                    ? messages.errors.valueTooHigh
                    : undefined
                }
                error={
                  !!values.receiveAmount &&
                  Number(values.receiveAmount) > MAX_TOKEN_AMOUNT
                }
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

            {/* USDC Value */}
            <Flex w='100%' alignItems='center' gap='xs'>
              <Text variant='body' size='m' color='subdued'>
                {messages.valueInUSDC}
              </Text>
              {isFirstBuyQuotePending ? (
                <LoadingSpinner size='s' css={{ display: 'inline-block' }} />
              ) : (
                <Text variant='body' size='m' color='default'>
                  ${firstBuyQuoteData?.usdcAmountUiString ?? '0.00'}
                </Text>
              )}
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
        errorText={firstBuyQuoteError ? messages.errors.quoteError : undefined}
      />
    </>
  )
}
