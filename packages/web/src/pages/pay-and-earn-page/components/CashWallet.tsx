import { useCallback } from 'react'

import {
  useIsManagedAccount,
  useFormattedUSDCBalance
} from '@audius/common/hooks'
import { walletMessages } from '@audius/common/messages'
import { Name } from '@audius/common/models'
import { TRANSACTION_HISTORY_PAGE } from '@audius/common/src/utils/route'
import {
  WithdrawUSDCModalPages,
  useWithdrawUSDCModal,
  useAddFundsModal,
  useBuySellModal
} from '@audius/common/store'
import {
  Button,
  Flex,
  IconInfo,
  IconLogoCircleUSDC,
  Paper,
  Text,
  IconButton,
  useMedia,
  motion
} from '@audius/harmony'

import { useModalState } from 'common/hooks/useModalState'
import { TextLink } from 'components/link'
import { PayoutWalletDisplay } from 'components/payout-wallet-display'
import Tooltip from 'components/tooltip/Tooltip'
import { make, track } from 'services/analytics'
import { zIndex } from 'utils/zIndex'

import { useCashWalletStyles } from './CashWallet.styles'

export const CashWallet = () => {
  const isManagedAccount = useIsManagedAccount()
  const { onOpen: openWithdrawUSDCModal } = useWithdrawUSDCModal()
  const { onOpen: openAddFundsModal } = useAddFundsModal()
  const { onOpen: openBuySellModal } = useBuySellModal()
  const { balanceFormatted, usdcValue, isLoading } = useFormattedUSDCBalance()
  const [, setPayoutWalletModalOpen] = useModalState('PayoutWallet')

  const styles = useCashWalletStyles()

  // We still need useMedia for responsive conditionals
  const { isSmall: isMobile, isExtraSmall: isSmallMobile } = useMedia()

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

  const handleBuySell = () => {
    openBuySellModal()
    // TODO: Add analytics tracking if needed
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
                {walletMessages.cashBalance}
              </Text>
              <Tooltip
                text={walletMessages.cashBalanceTooltip}
                placement='top'
                mount='page'
                shouldWrapContent={false}
                shouldDismissOnClick={false}
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
          <Text
            variant='display'
            size='m'
            color='default'
            css={{
              opacity: isLoading ? 0 : 1,
              transition: `opacity ${motion.calm}`
            }}
          >
            {balanceFormatted}
          </Text>

          {/* Payout Wallet Info */}
          <Flex
            alignItems='center'
            gap='s'
            css={styles.payoutWalletFlex}
            onClick={handlePayoutWalletClick}
          >
            <TextLink
              variant='visible'
              size='m'
              onClick={handlePayoutWalletClick}
            >
              {walletMessages.payoutWallet}
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
          {walletMessages.transactionHistory}
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
              disabled={isLoading}
            >
              {walletMessages.withdraw}
            </Button>
            <Button
              variant='secondary'
              css={{
                flex: 1
              }}
              onClick={handleAddFunds}
              disabled={isLoading}
            >
              {walletMessages.addFunds}
            </Button>
            <Button
              variant='secondary'
              css={{
                flex: 1
              }}
              onClick={handleBuySell}
              disabled={isLoading}
            >
              {walletMessages.buySell}
            </Button>
          </>
        ) : null}
      </Flex>
    </Paper>
  )
}
