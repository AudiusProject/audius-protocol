import { useState, useMemo } from 'react'

import {
  useConnectedWallets,
  useWalletBalances,
  useWalletSolBalance
} from '@audius/common/api'
import { buySellMessages } from '@audius/common/messages'
import { TOKEN_LISTING_MAP } from '@audius/common/src/store/ui/buy-audio/constants'
import { TokenInfo } from '@audius/common/src/store/ui/buy-sell/types'
import {
  Button,
  Flex,
  IconInfo,
  IconJupiterLogo,
  IconQuestionCircle,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  PlainButton,
  Text,
  TokenAmountInput
} from '@audius/harmony'
import { Form, Formik, useFormikContext } from 'formik'

import { IconAUDIO } from 'components/buy-audio-modal/components/Icons'
import { TokenIcon } from 'components/buy-sell-modal/TokenIcon'
import { TokenDropdown } from 'components/buy-sell-modal/components/TokenDropdown'
import { Tooltip } from 'components/tooltip'
import zIndex from 'utils/zIndex'

import { getLatestConnectedWallet } from '../utils'

const INPUT_TOKEN_MAP: Record<string, TokenInfo> = {
  USDC: {
    symbol: 'USDC',
    name: 'USDC',
    decimals: TOKEN_LISTING_MAP.USDC.decimals,
    balance: 0,
    address: TOKEN_LISTING_MAP.USDC.address,
    logoURI: TOKEN_LISTING_MAP.USDC.logoURI
  },
  SOL: {
    symbol: 'SOL',
    name: 'SOL',
    decimals: TOKEN_LISTING_MAP.SOL.decimals,
    balance: 0,
    address: TOKEN_LISTING_MAP.SOL.address,
    logoURI: TOKEN_LISTING_MAP.SOL.logoURI
  }
}

const INPUT_TOKEN_LIST = Object.values(INPUT_TOKEN_MAP)

enum FORM_FIELDS {
  inputAmount = 'inputAmount',
  outputAmount = 'outputAmount',
  inputToken = 'inputToken'
}
const DEFAULT_TOKEN = INPUT_TOKEN_MAP.USDC

type LaunchpadBuyFormValues = {
  [FORM_FIELDS.inputAmount]: string | undefined
  [FORM_FIELDS.outputAmount]: string | undefined
  [FORM_FIELDS.inputToken]: TokenInfo
}

const LaunchpadBuyContent = ({ onClose }: { onClose: () => void }) => {
  const { values, setFieldValue } = useFormikContext<LaunchpadBuyFormValues>()
  const { data: connectedWallets } = useConnectedWallets()
  const connectedWallet = useMemo(
    () => getLatestConnectedWallet(connectedWallets),
    [connectedWallets]
  )

  const { balances } = useWalletBalances({
    walletAddress: connectedWallet?.address ?? '',
    mints: [TOKEN_LISTING_MAP.USDC.address, TOKEN_LISTING_MAP.SOL.address]
  })
  const currentTokenBalance = useMemo(() => {
    return balances.find(
      (balance) => balance.mint === values.inputToken.address
    )
  }, [balances, values.inputToken])

  const onInputTokenChange = (token: TokenInfo) => {
    setFieldValue(FORM_FIELDS.inputToken, token)
  }

  const handleMaxClick = () => {
    setFieldValue(
      FORM_FIELDS.inputAmount,
      currentTokenBalance?.data?.balanceLocaleString ?? ''
    )
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

              {currentTokenBalance ? (
                <Flex alignItems='center' gap='xs'>
                  <TokenIcon
                    logoURI={values.inputToken.logoURI}
                    icon={values.inputToken.icon}
                    size='s'
                    hex
                  />
                  <Text variant='body' size='m' strength='strong'>
                    {buySellMessages.formattedAvailableBalance(
                      currentTokenBalance.data?.balanceLocaleString ?? '',
                      values.inputToken.symbol,
                      !!values.inputToken.isStablecoin
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
                  tokenLabel={`${values[FORM_FIELDS.inputToken].symbol}`}
                  value={values[FORM_FIELDS.inputAmount]}
                  onChange={(value) =>
                    setFieldValue(FORM_FIELDS.inputAmount, value)
                  }
                />
              </Flex>
              <Button variant='secondary' size='large' onClick={handleMaxClick}>
                {buySellMessages.max}
              </Button>
              <Flex css={(theme) => ({ minWidth: theme.spacing.unit15 })}>
                <TokenDropdown
                  selectedToken={values[FORM_FIELDS.inputToken]}
                  availableTokens={INPUT_TOKEN_LIST}
                  onTokenChange={onInputTokenChange}
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
              tokenLabel='$AUDIO'
              endIcon={<IconAUDIO />}
              value={values[FORM_FIELDS.outputAmount]}
              onChange={(value) =>
                setFieldValue(FORM_FIELDS.outputAmount, value)
              }
            />
          </Flex>
          {/* Button */}
          <Button variant='primary'>{buySellMessages.continue}</Button>
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

const LaunchpadBuyForm = ({ children }: { children: React.ReactNode }) => {
  const handleSubmit = (values: any) => {
    console.log(values)
  }
  return (
    <Flex direction='column' gap='s'>
      <Formik
        initialValues={{
          [FORM_FIELDS.inputAmount]: '',
          [FORM_FIELDS.outputAmount]: '',
          [FORM_FIELDS.inputToken]: DEFAULT_TOKEN
        }}
        onSubmit={handleSubmit}
      >
        <Form>{children}</Form>
      </Formik>
    </Flex>
  )
}

export const LaunchpadBuyModal = ({
  isOpen,
  onClose
}: {
  isOpen: boolean
  onClose: () => void
}) => {
  const [modalScreen, setModalScreen] = useState('input')

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='medium'>
      <LaunchpadBuyForm>
        {modalScreen === 'input' && <LaunchpadBuyContent onClose={onClose} />}
      </LaunchpadBuyForm>
    </Modal>
  )
}
