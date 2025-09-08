import { useMemo, useState, useCallback, useEffect } from 'react'

import { useTokenBalance } from '@audius/common/api'
import {
  Button,
  Flex,
  IconInfo,
  IconLogoCircleUSDCPng,
  Skeleton,
  Text,
  TextInput
} from '@audius/harmony'
import { useFormik } from 'formik'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { Tooltip } from 'components/tooltip'
import { env } from 'services/env'

import { AddCashBanner } from './components/AddCashBanner'
import { ArtistTokenDropdown } from './components/ArtistTokenDropdown'
import { TokenPairExchangeRateBanner } from './components/TokenPairExchangeRateBanner'

import { SwapFormState } from '.'

const messages = {
  youPay: 'You Pay',
  youReceive: 'You Receive',
  available: ' available',
  infoTooltipText:
    'This is the amount of USDC you have available to spend. You can add more USDC to your wallet in the wallet tab.',
  max: 'MAX',
  amountRequired: 'Please enter an amount',
  insufficientBalance: 'Insufficient balance',
  invalidAmount: 'Please enter a valid amount'
}

// Create validation schema for the buy form
const createBuyFormSchema = (maxBalanceFloat: number) =>
  z.object({
    inputAmount: z.number().refine(
      (val) => {
        return !!val && !isNaN(val) && val <= maxBalanceFloat
      },
      { message: messages.insufficientBalance }
    ),
    outputAmount: z.number().refine(
      (val) => {
        return !!val && !isNaN(val) && val > 0
      },
      { message: messages.invalidAmount }
    )
  })

type BuyFormValues = {
  inputAmount: string
  outputAmount: string
}

type BuyTabProps = {
  onOutputTokenTypeChange: (symbol: string) => void
  onFormStateChange: (state: SwapFormState) => void
  onFormSubmit: () => void
}

export const BuyTab = ({
  onOutputTokenTypeChange,
  onFormStateChange,
  onFormSubmit
}: BuyTabProps) => {
  const { data: usdcBalance, isPending: isUSDCBalancePending } =
    useTokenBalance({ mint: env.USDC_MINT_ADDRESS })
  const { balanceLocaleString } = usdcBalance ?? {}
  const [outputToken, setOutputToken] = useState<string>('$AUDIO')
  const handleOutputTokenTypeChange = useCallback(
    (symbol: string) => {
      setOutputToken(symbol)
      onOutputTokenTypeChange(symbol)
    },
    [onOutputTokenTypeChange]
  )

  const maxBalanceFloat = parseFloat(balanceLocaleString ?? '0')

  // Set up schema using current balance
  const validationSchema = useMemo(
    () => toFormikValidationSchema(createBuyFormSchema(maxBalanceFloat)),
    [maxBalanceFloat]
  )

  // Initialize Formik
  const form = useFormik<BuyFormValues>({
    initialValues: {
      inputAmount: '',
      outputAmount: ''
    },
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    // Form submission will be handled by the parent BuySellModalContent component
    onSubmit: onFormSubmit
  })

  // Notify parent of form state changes
  useEffect(() => {
    onFormStateChange({
      isValid: form.isValid && form.dirty,
      inputAmount: form.values.inputAmount
        ? parseFloat(form.values.inputAmount)
        : 0,
      inputTokenSymbol: '$USDC',
      outputAmount: form.values.outputAmount
        ? parseFloat(form.values.outputAmount)
        : 0,
      outputTokenSymbol: outputToken
    })
  }, [
    form.isValid,
    form.dirty,
    form.values,
    form.submitForm,
    onFormStateChange,
    outputToken
  ])

  const handleMaxClick = () => {
    form.setFieldValue('inputAmount', maxBalanceFloat.toString())
    form.setFieldTouched('inputAmount', true)
  }

  return (
    <form onSubmit={form.handleSubmit}>
      <Flex gap='xl' w='100%' direction='column'>
        <Flex direction='column' gap='s' w='100%'>
          <Flex gap='s' justifyContent='space-between' w='100%'>
            <Text variant='title' size='l'>
              {messages.youPay}
            </Text>
            <Flex gap='xs' alignItems='center'>
              <IconLogoCircleUSDCPng hex />
              <Text
                variant='body'
                size='m'
                strength='strong'
                textAlign='center'
              >
                $
                {isUSDCBalancePending ? (
                  <Skeleton
                    w='50px'
                    h='16px'
                    css={{ display: 'inline-block', marginRight: '4px' }}
                  />
                ) : (
                  balanceLocaleString
                )}
                {messages.available}
              </Text>
              <Tooltip text={messages.infoTooltipText}>
                <IconInfo
                  color='subdued'
                  size='m'
                  css={{ cursor: 'pointer' }}
                />
              </Tooltip>
            </Flex>
          </Flex>
          <Flex gap='s' alignItems='stretch'>
            <TextInput
              name='inputAmount'
              startAdornmentText='$'
              endAdornmentText='$USDC'
              label='Amount of USDC you pay'
              placeholder='0.00'
              width='100%'
              hideLabel
              min='0'
              type='number'
              value={form.values.inputAmount}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              aria-required
              error={
                form.touched.inputAmount && form.errors.inputAmount
                  ? true
                  : undefined
              }
              helperText={
                form.touched.inputAmount && form.errors.inputAmount
                  ? form.errors.inputAmount
                  : undefined
              }
            />
            <Button
              variant='secondary'
              css={{ height: '64px' }}
              onClick={handleMaxClick}
              type='button'
            >
              {messages.max}
            </Button>
          </Flex>
        </Flex>
        <Flex direction='column' gap='s' w='100%'>
          <Flex gap='s' justifyContent='space-between' w='100%'>
            <Text variant='title' size='l'>
              {messages.youReceive}
            </Text>
          </Flex>
          <Flex gap='s'>
            <TextInput
              name='outputAmount'
              endAdornmentText={outputToken}
              label='Amount of AUDIO you receive'
              placeholder='0.00'
              width='100%'
              hideLabel
              value={form.values.outputAmount}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              type='number'
              aria-required
              error={
                form.touched.outputAmount && form.errors.outputAmount
                  ? true
                  : undefined
              }
              helperText={
                form.touched.outputAmount && form.errors.outputAmount
                  ? form.errors.outputAmount
                  : undefined
              }
            />
            <ArtistTokenDropdown
              labelText='Select a token to receive'
              onSelect={handleOutputTokenTypeChange}
            />
          </Flex>
        </Flex>
        {!usdcBalance || usdcBalance.balance.value < BigInt(0) ? (
          <TokenPairExchangeRateBanner />
        ) : null}
        <AddCashBanner onClick={() => {}} />
      </Flex>
    </form>
  )
}
