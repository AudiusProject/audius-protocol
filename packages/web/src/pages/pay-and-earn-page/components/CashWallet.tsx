import { useCallback } from 'react'

import { useIsManagedAccount, useUSDCBalance } from '@audius/common/hooks'
import { Name, Status } from '@audius/common/models'
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
  IconLogoCircle,
  IconLogoCircleUSDC,
  Paper,
  Text,
  TextLink
} from '@audius/harmony'
import BN from 'bn.js'

import { useModalState } from 'common/hooks/useModalState'
import { make, track } from 'services/analytics'

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
  transactionHistory: 'Transaction History'
}

export const CashWallet = () => {
  // Renamed component
  const isManagedAccount = useIsManagedAccount()
  const { onOpen: openWithdrawUSDCModal } = useWithdrawUSDCModal()
  const { onOpen: openAddFundsModal } = useAddFundsModal()
  const { data: balance, status: balanceStatus } = useUSDCBalance()
  const [, setPayoutWalletModalOpen] = useModalState('PayoutWallet')

  // Calculate the balance in cents by flooring to 2 decimal places then multiplying by 100
  const usdcValue = USDC(balance ?? new BN(0)).floor(2)
  const balanceCents = Number(usdcValue.toString()) * 100

  // Format the balance for display using the trunc and toShorthand methods
  const balanceFormatted = USDC(balanceCents / 100)
    .trunc()
    .toShorthand()

  const handleWithdraw = () => {
    openWithdrawUSDCModal({
      page: WithdrawUSDCModalPages.ENTER_TRANSFER_DETAILS
    })
    track(
      make({
        eventName: Name.WITHDRAW_USDC_MODAL_OPENED,
        currentBalance: balanceCents / 100
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
    <Paper direction='column' shadow='far' ph='xl' pv='l' borderRadius='l'>
      {/* Top Area with Balance Info and Transaction History */}
      <Flex justifyContent='space-between' alignItems='flex-start' w='100%'>
        {/* Left Column - Balance Info */}
        <Flex direction='column' gap='s' alignItems='flex-start'>
          {/* Cash Balance Title */}
          <Flex alignItems='center' gap='s'>
            <IconLogoCircleUSDC size='l' />
            <Flex alignItems='center' gap='xs'>
              <Text variant='heading' size='s' color='subdued'>
                {messages.cashBalance}
              </Text>
              <IconInfo size='s' color='subdued' />
            </Flex>
          </Flex>

          {/* Balance Value */}
          <Text variant='display' size='m' color='default'>
            ${balanceStatus === Status.LOADING ? '--.--' : balanceFormatted}
          </Text>

          {/* Payout Wallet Info */}
          <Flex alignItems='center' gap='s'>
            <TextLink
              variant='visible'
              size='m'
              onClick={handlePayoutWalletClick}
            >
              {messages.payoutWallet}
            </TextLink>
            {/* Wallet Display */}
            <Flex
              alignItems='center'
              backgroundColor='surface1'
              border='default'
              borderRadius='circle'
              pt='xs'
              pl='xs'
              pr='s'
              gap='xs'
            >
              <IconLogoCircle size='l' />
              <Text variant='body' size='m' strength='strong' ellipses>
                {messages.builtInWallet}
              </Text>
            </Flex>
          </Flex>
        </Flex>

        {/* Right Side - Transaction History Link */}
        <TextLink variant='visible' size='m'>
          {messages.transactionHistory}
        </TextLink>
      </Flex>

      {/* Bottom Button Area */}
      <Flex gap='l' pt='m' w='100%'>
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
