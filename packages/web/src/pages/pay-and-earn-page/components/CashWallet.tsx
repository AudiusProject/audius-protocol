import { useCallback } from 'react'

import { useIsManagedAccount, useUSDCBalance } from '@audius/common/hooks'
import { Name, Status } from '@audius/common/models'
import { TRANSACTION_HISTORY_PAGE } from '@audius/common/src/utils/route'
import {
  WithdrawUSDCModalPages,
  useWithdrawUSDCModal,
  useAddFundsModal
} from '@audius/common/store'
import { USDC } from '@audius/fixed-decimal'
import {
  Button,
  Flex,
  IconInfo,
  IconLogoCircleUSDC,
  Paper,
  Text,
  IconButton,
  useMedia
} from '@audius/harmony'
import BN from 'bn.js'

import { useModalState } from 'common/hooks/useModalState'
import { TextLink } from 'components/link'
import { PayoutWalletDisplay } from 'components/payout-wallet-display'
import Tooltip from 'components/tooltip/Tooltip'
import { make, track } from 'services/analytics'
import { zIndex } from 'utils/zIndex'

import { useCashWalletStyles } from './CashWallet.styles'

const messages = {
  usdc: 'USDC',
  earn: 'Earn USDC by selling your music',
  buyAndSell: 'Buy and sell music with USDC',
  learnMore: 'Learn More',
  withdraw: 'Withdraw',
  addFunds: 'Add Cash',
  salesSummary: 'Sales Summary',
  withdrawalHistory: 'Withdrawal History',
  cashBalance: 'Cash Balance',
  payoutWallet: 'Payout Wallet',
  builtInWallet: 'Built-In Wallet',
  transactionHistory: 'Transaction History',
  cashBalanceTooltip:
    'Your cash balance is stored as USDC in your built-in wallet'
}

export const CashWallet = () => {
  const isManagedAccount = useIsManagedAccount()
  const { onOpen: openWithdrawUSDCModal } = useWithdrawUSDCModal()
  const { onOpen: openAddFundsModal } = useAddFundsModal()
  const { data: balance, status: balanceStatus } = useUSDCBalance()
  const [, setPayoutWalletModalOpen] = useModalState('PayoutWallet')

  const styles = useCashWalletStyles()

  // We still need useMedia for responsive conditionals
  const { isSmall: isMobile, isExtraSmall: isSmallMobile } = useMedia()

  // Calculate the balance in cents by flooring to 2 decimal places then multiplying by 100
  const usdcValue = USDC(balance ?? new BN(0)).floor(2)

  // Format the balance for display with exactly 2 decimal places
  const balanceFormatted = usdcValue.toFixed(2).replace('$', '')

  const handleWithdraw = () => {
    openWithdrawUSDCModal({
      page: WithdrawUSDCModalPages.ENTER_TRANSFER_DETAILS
    })
    track(
      make({
        eventName: Name.WITHDRAW_USDC_MODAL_OPENED,
        currentBalance: Number(usdcValue.toString())
      })
    )
  }

  const handleAddFunds = () => {
    openAddFundsModal()
    track(
      make({
        eventName: Name.BUY_USDC_ADD_FUNDS_MANUALLY
      })
    )
  }

  const handlePayoutWalletClick = useCallback(() => {
    setPayoutWalletModalOpen(true)
  }, [setPayoutWalletModalOpen])

  return (
    <Paper
      direction='column'
      shadow='far'
      ph={isMobile ? 'l' : 'xl'}
      pv={isMobile ? 'm' : 'l'}
      borderRadius='l'
    >
      <Flex
        justifyContent='space-between'
        alignItems='flex-start'
        w='100%'
        css={styles.mainFlex}
      >
        {/* Left Column - Balance Info */}
        <Flex direction='column' gap='s' alignItems='flex-start'>
          <Flex alignItems='center' gap='s'>
            <IconLogoCircleUSDC size='l' />
            <Flex alignItems='center' gap='xs'>
              <Text variant='heading' size='s' color='subdued'>
                {messages.cashBalance}
              </Text>
              <Tooltip
                text={messages.cashBalanceTooltip}
                placement='top'
                mount='page'
                shouldWrapContent={false}
                css={{ zIndex: zIndex.CASH_WALLET_TOOLTIP }}
              >
                <IconButton
                  icon={IconInfo}
                  size='s'
                  color='subdued'
                  activeColor='default'
                  aria-label='Cash balance information'
                />
              </Tooltip>
            </Flex>
          </Flex>

          {/* Balance Value */}
          <Text variant='display' size='m' color='default'>
            ${balanceStatus === Status.LOADING ? '--.--' : balanceFormatted}
          </Text>

          {/* Payout Wallet Info */}
          <Flex alignItems='center' gap='s' css={styles.payoutWalletFlex}>
            <TextLink
              variant='visible'
              size='m'
              onClick={handlePayoutWalletClick}
            >
              {messages.payoutWallet}
            </TextLink>
            {/* Wallet Display */}
            <PayoutWalletDisplay />
          </Flex>
        </Flex>

        {/* Right Side - Transaction History Link */}
        <TextLink
          variant='visible'
          size='m'
          to={TRANSACTION_HISTORY_PAGE}
          css={styles.transactionLink}
        >
          {messages.transactionHistory}
        </TextLink>
      </Flex>

      {/* Bottom Button Area */}
      <Flex
        gap={isSmallMobile ? 'm' : 'l'}
        pt='m'
        w='100%'
        css={styles.buttonArea}
      >
        {!isManagedAccount ? (
          <>
            <Button
              variant='primary'
              css={{
                flex: 1
              }}
              onClick={handleWithdraw}
              disabled={balanceStatus === Status.LOADING}
            >
              {messages.withdraw}
            </Button>
            <Button
              variant='secondary'
              css={{
                flex: 1
              }}
              onClick={handleAddFunds}
              disabled={balanceStatus === Status.LOADING}
            >
              {messages.addFunds}
            </Button>
          </>
        ) : null}
      </Flex>
    </Paper>
  )
}
