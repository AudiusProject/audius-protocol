import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  useConnectedWallets,
  useFirstBuyQuote,
  useWalletAudioBalances
} from '@audius/common/api'
import { useDebouncedCallback } from '@audius/common/hooks'
import { AUDIO } from '@audius/fixed-decimal'
import {
  Artwork,
  Button,
  Flex,
  Hint,
  IconWallet,
  LoadingSpinner,
  Paper,
  Text,
  TextLink,
  TokenAmountInput
} from '@audius/harmony'
import { useFormikContext } from 'formik'
import { usePrevious } from 'react-use'

import { setField } from 'common/store/pages/signon/actions'
import { IconAUDIO } from 'components/buy-audio-modal/components/Icons'
import { useFormImageUrl } from 'hooks/useFormImageUrl'
import { useLaunchpadConfig } from 'hooks/useLaunchpadConfig'

import { ArtistCoinsSubmitRow } from '../components/ArtistCoinsSubmitRow'
import type { PhasePageProps, SetupFormValues } from '../components/types'
import { AMOUNT_OF_STEPS } from '../constants'
import { getLatestConnectedWallet } from '../utils'
import { FIELDS } from '../validation'

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
    valueTooHigh: 'Value is too high. Please enter a lower value.',
    insufficientBalance: 'Insufficient $AUDIO balance.'
  },
  createCoin: 'Create Coin',
  max: 'MAX',
  audioBalance: (balance: string) => `${balance} $AUDIO`,
  buyAudio: 'Buy $AUDIO'
}

const INPUT_DEBOUNCE_TIME = 400

export const BuyCoinPage = ({ onContinue, onBack }: PhasePageProps) => {
  // Use Formik context to manage form state, including payAmount and receiveAmount
  const { values, setFieldValue, errors, validateForm } =
    useFormikContext<SetupFormValues>()
  const { data: launchpadConfig } = useLaunchpadConfig()
  const { maxTokenOutputAmount, maxAudioInputAmount } = launchpadConfig ?? {
    maxTokenOutputAmount: Infinity,
    maxAudioInputAmount: Infinity
  }
  const [isPayAmountChanging, setIsPayAmountChanging] = useState(false)
  const [isReceiveAmountChanging, setIsReceiveAmountChanging] = useState(false)
  const { data: connectedWallets } = useConnectedWallets()
  const connectedWallet = useMemo(
    () => getLatestConnectedWallet(connectedWallets),
    [connectedWallets]
  )
  const { data: audioBalanceArr } = useWalletAudioBalances({
    wallets: [
      { address: connectedWallet!.address, chain: connectedWallet!.chain }
    ]
  })
  const { audioBalanceString } = useMemo(() => {
    if (!audioBalanceArr || !audioBalanceArr[0].balance) {
      return { audioBalanceString: '0.00', audioBalanceInt: 0 }
    }
    return {
      audioBalanceString: AUDIO(audioBalanceArr[0].balance).toLocaleString(
        'en-US',
        {
          maximumFractionDigits: 2,
          roundingMode: 'trunc'
        }
      ),
      audioBalanceInt: Number(AUDIO(audioBalanceArr[0].balance).toFixed(2))
    }
  }, [audioBalanceArr])

  const imageUrl = useFormImageUrl(values.coinImage)

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

  const prevFirstBuyQuoteData = usePrevious(firstBuyQuoteData)
  // When quote comes back, update our inputs with the new values
  useEffect(() => {
    if (firstBuyQuoteData) {
      if (isReceiveAmountChanging) {
        setFieldValue(
          FIELDS.receiveAmount,
          firstBuyQuoteData.tokenAmountUiString
        )
        validateForm()
      }
      if (isPayAmountChanging) {
        setFieldValue(FIELDS.payAmount, firstBuyQuoteData.audioAmountUiString)
        validateForm()
      }
    }
  }, [
    firstBuyQuoteData,
    setFieldValue,
    isReceiveAmountChanging,
    isPayAmountChanging,
    prevFirstBuyQuoteData,
    validateForm
  ])

  const handleBack = () => {
    onBack?.()
  }

  const handleContinue = () => {
    onContinue?.()
  }

  const handleMaxClick = () => {
    setFieldValue(FIELDS.payAmount, audioBalanceString)
    debouncedPayAmountChange(audioBalanceString)
  }

  const debouncedPayAmountChange = useDebouncedCallback(
    async (payAmount: string) => {
      const payAmountNumber = parseFloat(payAmount)
      if (payAmount && payAmountNumber <= maxAudioInputAmount) {
        setIsReceiveAmountChanging(true)
        getFirstBuyQuote({ audioUiInputAmount: payAmount })
      }
    },
    [getFirstBuyQuote, maxAudioInputAmount],
    INPUT_DEBOUNCE_TIME
  )

  const debouncedReceiveAmountChange = useDebouncedCallback(
    async (receiveAmount: string) => {
      const receiveAmountNumber = parseFloat(receiveAmount)
      // Check for field validity before making api calls for the quotes
      if (receiveAmount && receiveAmountNumber <= maxTokenOutputAmount) {
        setIsPayAmountChanging(true)
        getFirstBuyQuote({ tokenUiOutputAmount: receiveAmount })
      }
    },
    [getFirstBuyQuote, maxTokenOutputAmount],
    INPUT_DEBOUNCE_TIME
  )

  const handlePayAmountChange = useCallback(
    async (value: string, _valueBigInt: bigint) => {
      setFieldValue(FIELDS.payAmount, value)
      debouncedPayAmountChange(value)
    },
    [setFieldValue, debouncedPayAmountChange]
  )

  const handleReceiveAmountChange = useCallback(
    (value: string, _valueBigInt: bigint) => {
      setFieldValue(FIELDS.receiveAmount, value)
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
                <Flex gap='s'>
                  <TextLink
                    variant='visible'
                    // TODO: onclick show modals
                  >
                    {messages.buyAudio}
                  </TextLink>
                  <Flex gap='xs'>
                    <IconWallet color='subdued' />
                    <Text variant='body' size='m' color='subdued'>
                      {audioBalanceString} $AUDIO
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
              <Flex gap='s' w='100%'>
                <TokenAmountInput
                  label={messages.youPay}
                  tokenLabel='AUDIO'
                  decimals={8}
                  value={values[FIELDS.payAmount] ?? ''}
                  onChange={handlePayAmountChange}
                  placeholder='0.00'
                  hideLabel
                  disabled={isPayAmountChanging}
                  endIcon={<IconAUDIO />}
                  error={!!errors[FIELDS.payAmount]}
                  helperText={errors[FIELDS.payAmount]}
                />
                <Button
                  variant='secondary'
                  size='large'
                  onClick={handleMaxClick}
                >
                  {messages.max}
                </Button>
              </Flex>
            </Flex>

            {/* You Receive Section */}
            <Flex direction='column' gap='s'>
              <Text variant='heading' size='s' color='default'>
                {messages.youReceive}
              </Text>
              <TokenAmountInput
                label={messages.youReceive}
                tokenLabel={`$${values[FIELDS.coinSymbol]}`}
                decimals={6}
                value={values[FIELDS.receiveAmount] ?? ''}
                onChange={handleReceiveAmountChange}
                placeholder='0'
                hideLabel
                disabled={isReceiveAmountChanging}
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
                error={!!errors[FIELDS.receiveAmount]}
                helperText={errors[FIELDS.receiveAmount]}
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
        continueText={messages.createCoin}
        errorText={firstBuyQuoteError ? messages.errors.quoteError : undefined}
      />
    </>
  )
}
