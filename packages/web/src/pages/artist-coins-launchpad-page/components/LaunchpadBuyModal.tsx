import { useContext, useEffect, useMemo, useState } from 'react'

import { buySellMessages } from '@audius/common/messages'
import { useConnectedWallets } from '@audius/common/src/api/tan-query/wallets/useConnectedWallets'
import { TOKEN_LISTING_MAP } from '@audius/common/src/store/ui/buy-audio/constants'
import { TokenInfo } from '@audius/common/src/store/ui/buy-sell/types'
import { useTokenSwapForm } from '@audius/common/src/store/ui/buy-sell/useTokenSwapForm'
import { useTokenAmountFormatting } from '@audius/common/store'
import {
  Button,
  Flex,
  IconInfo,
  IconJupiterLogo,
  IconQuestionCircle,
  LoadingSpinner,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  PlainButton,
  Text,
  TokenAmountInput
} from '@audius/harmony'
import { FormikProvider, useFormikContext } from 'formik'

import { IconAUDIO } from 'components/buy-audio-modal/components/Icons'
import { SwapBalanceSection } from 'components/buy-sell-modal/SwapBalanceSection'
import { TokenIcon } from 'components/buy-sell-modal/TokenIcon'
import { TransactionSuccessScreen } from 'components/buy-sell-modal/TransactionSuccessScreen'
import { TokenDropdown } from 'components/buy-sell-modal/components/TokenDropdown'
import { ToastContext } from 'components/toast/ToastContext'
import { Tooltip } from 'components/tooltip'
import { useExternalWalletSwap } from 'hooks/useExternalWalletSwap'
import zIndex from 'utils/zIndex'

import { getLatestConnectedWallet } from '../utils'

const INPUT_TOKEN_MAP: Record<string, TokenInfo> = {
  USDC: {
    symbol: 'USDC',
    name: 'USDC',
    decimals: TOKEN_LISTING_MAP.USDC.decimals,
    balance: null,
    address: TOKEN_LISTING_MAP.USDC.address,
    logoURI: TOKEN_LISTING_MAP.USDC.logoURI,
    isStablecoin: true
  },
  SOL: {
    symbol: 'SOL',
    name: 'SOL',
    decimals: TOKEN_LISTING_MAP.SOL.decimals,
    balance: null,
    address: TOKEN_LISTING_MAP.SOL.address,
    logoURI: TOKEN_LISTING_MAP.SOL.logoURI,
    isStablecoin: false
  }
}

const OUTPUT_TOKEN: TokenInfo = {
  symbol: '$AUDIO',
  name: 'AUDIO',
  balance: null,
  decimals: TOKEN_LISTING_MAP.AUDIO.decimals,
  address: TOKEN_LISTING_MAP.AUDIO.address,
  isStablecoin: false
}

const INPUT_TOKEN_LIST = Object.values(INPUT_TOKEN_MAP)
const DEFAULT_INPUT_TOKEN = INPUT_TOKEN_MAP.USDC

type FormikValues = {
  inputAmount: string
  outputAmount: string
  selectedInputToken: TokenInfo
  selectedOutputToken: TokenInfo
}

const FormInputStep = ({
  onClose,
  onContinue,
  availableBalance,
  isBalanceLoading,
  handleMaxClick,
  onInputTokenChange,
  onInputAmountChange,
  onOutputAmountChange
}: {
  onClose: () => void
  onContinue: () => void
  availableBalance: number
  isBalanceLoading: boolean
  handleMaxClick: () => void
  onInputTokenChange: (token: TokenInfo) => void
  onInputAmountChange: (value: string) => void
  onOutputAmountChange: (value: string) => void
}) => {
  const { values, errors, setFieldValue } = useFormikContext<FormikValues>()

  const handleInputTokenChange = (token: TokenInfo) => {
    onInputTokenChange(token)
    setFieldValue('selectedInputToken', token)
  }
  return (
    <>
      <ModalHeader onClose={onClose}>
        <ModalTitle title={buySellMessages.buyAudioTitle} />
        <PlainButton
          size='default'
          iconLeft={IconQuestionCircle}
          onClick={() => {
            window.open('https://help.audius.co/product/wallet-guide', '_blank')
          }}
          css={(theme) => ({
            position: 'absolute',
            top: theme.spacing.xl,
            right: theme.spacing.xl,
            zIndex: zIndex.BUY_SELL_MODAL + 1
          })}
        >
          {buySellMessages.help}
        </PlainButton>
      </ModalHeader>
      <ModalContent>
        <Flex direction='column' gap='xl'>
          <Flex column gap='s'>
            {/* Balance text  */}
            <Flex justifyContent='space-between' alignItems='center'>
              <Text variant='title' size='l' color='default'>
                {buySellMessages.youPay}
              </Text>

              {!isBalanceLoading && availableBalance !== undefined ? (
                <Flex alignItems='center' gap='xs'>
                  <TokenIcon
                    logoURI={values.selectedInputToken.logoURI}
                    icon={values.selectedInputToken.icon}
                    size='s'
                    hex
                  />
                  <Text variant='body' size='m' strength='strong'>
                    {buySellMessages.formattedAvailableBalance(
                      availableBalance.toLocaleString(),
                      values.selectedInputToken.symbol,
                      !!values.selectedInputToken.isStablecoin
                    )}
                  </Text>
                  <Tooltip
                    text={buySellMessages.availableBalanceTooltip}
                    mount='body'
                  >
                    <IconInfo color='subdued' size='s' />
                  </Tooltip>
                </Flex>
              ) : null}
            </Flex>
            {/* Pay input */}
            <Flex gap='s' flex={1}>
              <Flex flex={1}>
                <TokenAmountInput
                  hideLabel
                  label={buySellMessages.youPay}
                  placeholder='0.00'
                  decimals={8}
                  tokenLabel={values.selectedInputToken.symbol}
                  value={values.inputAmount}
                  onChange={onInputAmountChange}
                  error={!!errors.inputAmount}
                  helperText={errors.inputAmount}
                />
              </Flex>
              <Button variant='secondary' size='large' onClick={handleMaxClick}>
                {buySellMessages.max}
              </Button>
              <Flex css={(theme) => ({ minWidth: theme.spacing.unit15 })}>
                <TokenDropdown
                  selectedToken={values.selectedInputToken}
                  availableTokens={INPUT_TOKEN_LIST}
                  onTokenChange={handleInputTokenChange}
                />
              </Flex>
            </Flex>
          </Flex>
          {/* Receive input */}
          <Flex column gap='s'>
            <Text variant='title' size='l' color='default'>
              {buySellMessages.youReceive}
            </Text>
            <TokenAmountInput
              hideLabel
              placeholder='0.00'
              label={buySellMessages.youReceive}
              tokenLabel={OUTPUT_TOKEN.symbol}
              endIcon={<IconAUDIO />}
              value={values.outputAmount}
              //   onChange={handleOutputAmountChange}
            />
          </Flex>
          {/* Button */}
          <Button variant='primary' onClick={onContinue}>
            {buySellMessages.continue}
          </Button>
        </Flex>
      </ModalContent>
      <ModalFooter gap='s' borderTop='strong' backgroundColor='surface1' pv='m'>
        <Text variant='label' size='xs' color='subdued'>
          {buySellMessages.poweredBy}
        </Text>
        <IconJupiterLogo />
      </ModalFooter>
    </>
  )
}

const ConfirmationStep = ({
  onClose,
  onBack,
  onConfirm,
  isConfirming
}: {
  onClose: () => void
  onBack: () => void
  onConfirm: () => void
  isConfirming: boolean // TODO
}) => {
  const { values } = useFormikContext<FormikValues>()
  const { formattedAmount: formattedPayAmount } = useTokenAmountFormatting({
    amount: values.inputAmount,
    isStablecoin: !!values.selectedInputToken.isStablecoin,
    decimals: values.selectedInputToken.decimals
  })

  const { formattedAmount: formattedReceiveAmount } = useTokenAmountFormatting({
    amount: values.outputAmount,
    isStablecoin: !!values.selectedOutputToken.isStablecoin,
    decimals: values.selectedOutputToken.decimals
  })
  return (
    <>
      <ModalHeader onClose={onClose}>
        <ModalTitle title={buySellMessages.buyAudioTitle} />
      </ModalHeader>
      <ModalContent>
        <Flex direction='column' gap='l'>
          <Text variant='body' size='m' textAlign='center'>
            {buySellMessages.confirmReview}
          </Text>
          <Flex direction='column' gap='xl'>
            <SwapBalanceSection
              title={buySellMessages.youPay}
              tokenInfo={values.selectedInputToken}
              amount={formattedPayAmount ?? ''}
            />
            <SwapBalanceSection
              title={buySellMessages.youReceive}
              tokenInfo={values.selectedOutputToken}
              amount={formattedReceiveAmount ?? ''}
              //   priceLabel={values.currentExchangeRate}
            />
          </Flex>

          <Flex gap='s' mt='xl'>
            <Button variant='secondary' fullWidth onClick={onBack}>
              {buySellMessages.back}
            </Button>
            <Button
              variant='primary'
              fullWidth
              onClick={onConfirm}
              isLoading={isConfirming}
            >
              {buySellMessages.confirm}
            </Button>
          </Flex>
        </Flex>
      </ModalContent>
    </>
  )
}

const SuccessStep = ({ onClose }: { onClose: () => void }) => {
  const { values } = useFormikContext<FormikValues>()

  return (
    <>
      <ModalHeader onClose={onClose}>
        <ModalTitle title={buySellMessages.modalSuccessTitle} />
      </ModalHeader>
      <ModalContent css={{ padding: 0 }}>
        <TransactionSuccessScreen
          payTokenInfo={values.selectedInputToken}
          receiveTokenInfo={OUTPUT_TOKEN}
          baseTokenSymbol={values.selectedInputToken.symbol}
          payAmount={Number(values.inputAmount)}
          receiveAmount={Number(values.outputAmount)}
          hideUSDCTooltip
          onDone={onClose}
        />
      </ModalContent>
    </>
  )
}

const LoadingStep = () => {
  return (
    <ModalContent>
      <Flex
        alignItems='center'
        justifyContent='center'
        flex={1}
        css={{ minHeight: 400, minWidth: 400 }}
      >
        <LoadingSpinner size='3xl' />
      </Flex>
    </ModalContent>
  )
}

type BuyModalStep = 'form' | 'confirmation' | 'success' | 'loading'

export const LaunchpadBuyModal = ({
  isOpen,
  onClose
}: {
  isOpen: boolean
  onClose: () => void
}) => {
  const { toast } = useContext(ToastContext)
  // TODO: ideally this is just a form field
  const [selectedInputToken, setSelectedInputToken] =
    useState(DEFAULT_INPUT_TOKEN)

  const {
    mutate: swapTokens,
    isPending: swapPending,
    isSuccess: swapSuccess,
    isError: swapError
  } = useExternalWalletSwap()

  useEffect(() => {
    if (swapSuccess) {
      setCurrentStep('success')
    }
    if (swapPending) {
      setCurrentStep('loading')
    }
    if (swapError) {
      console.error(swapError)
      toast(buySellMessages.transactionFailed, 5000)
      setCurrentStep('form')
    }
  }, [swapSuccess, swapPending, swapError, toast])
  const onInputTokenChange = (token: TokenInfo) => {
    setSelectedInputToken(token)
  }
  const { data: connectedWallets } = useConnectedWallets()
  const externalWalletAddress = useMemo(
    () => getLatestConnectedWallet(connectedWallets)?.address,
    [connectedWallets]
  )
  const {
    availableBalance,
    isBalanceLoading,
    formik: buyModalForm,
    handleInputAmountChange,
    handleMaxClick,
    handleOutputAmountChange
  } = useTokenSwapForm({
    inputToken: selectedInputToken,
    outputToken: OUTPUT_TOKEN,
    externalWalletAddress
  })

  const [currentStep, setCurrentStep] = useState<BuyModalStep>('form')

  const handleContinue = () => {
    if (currentStep === 'form') {
      setCurrentStep('confirmation')
    } else if (currentStep === 'confirmation') {
      swapTokens({
        inputAmountUi: Number(buyModalForm.values.inputAmount),
        inputToken: selectedInputToken,
        outputToken: OUTPUT_TOKEN,
        walletAddress: externalWalletAddress!
      })
    }
  }

  const handleBack = () => {
    if (currentStep === 'confirmation') {
      setCurrentStep('form')
    }
  }

  const renderCurrentStep = () => {
    if (currentStep === 'loading') {
      return <LoadingStep />
    }
    if (currentStep === 'success') {
      return <SuccessStep onClose={onClose} />
    }
    if (currentStep === 'confirmation') {
      return (
        <ConfirmationStep
          onClose={onClose}
          onBack={handleBack}
          onConfirm={handleContinue}
          isConfirming={false}
        />
      )
    }
    // Default to the form input step
    return (
      <FormInputStep
        onClose={onClose}
        onContinue={handleContinue}
        availableBalance={availableBalance}
        isBalanceLoading={isBalanceLoading}
        handleMaxClick={handleMaxClick}
        onInputTokenChange={onInputTokenChange}
        onInputAmountChange={handleInputAmountChange}
        onOutputAmountChange={handleOutputAmountChange}
      />
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='medium'>
      <FormikProvider value={buyModalForm}>
        {renderCurrentStep()}
      </FormikProvider>
    </Modal>
  )
}
