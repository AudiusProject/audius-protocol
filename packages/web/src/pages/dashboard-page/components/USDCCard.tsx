import { useCallback } from 'react'

import {
  BNUSDC,
  Name,
  WithdrawUSDCModalPages,
  formatCurrencyBalance,
  formatUSDCWeiToFloorCentsNumber,
  useUSDCManualTransferModal,
  useWithdrawUSDCModal
} from '@audius/common'
import {
  Button,
  ButtonType,
  IconWithdraw,
  IconKebabHorizontal,
  PlainButton,
  IconQuestionCircle,
  PlainButtonType
} from '@audius/harmony'
import { PopupMenu, PopupMenuItem, LogoUSDC } from '@audius/stems'
import BN from 'bn.js'

import { Icon } from 'components/Icon'
import { Text } from 'components/typography'
import { useGoToRoute } from 'hooks/useGoToRoute'
import { make, track } from 'services/analytics'
import { SALES_PAGE, WITHDRAWALS_PAGE } from 'utils/route'

import styles from './USDCCard.module.css'

const LEARN_MORE_LINK =
  'https://support.audius.co/help/Understanding-USDC-on-Audius'

const messages = {
  usdc: 'USDC',
  earn: 'Earn USDC by selling your music',
  buyAndSell: 'Buy and sell music with USDC',
  learnMore: 'Learn More',
  withdraw: 'Withdraw',
  addFunds: 'Add Funds',
  salesSummary: 'Sales Summary',
  withdrawalHistory: 'Withdrawal History'
}

export const USDCCard = ({
  balance,
  isArtist
}: {
  balance: BNUSDC
  isArtist: boolean
}) => {
  const goToRoute = useGoToRoute()
  const { onOpen: openWithdrawUSDCModal } = useWithdrawUSDCModal()
  const { onOpen: openUsdcManualTransferModal } = useUSDCManualTransferModal()

  const balanceCents = formatUSDCWeiToFloorCentsNumber(
    (balance ?? new BN(0)) as BNUSDC
  )
  const balanceFormatted = formatCurrencyBalance(balanceCents / 100)

  const handleLearnMore = useCallback(() => {
    window.open(LEARN_MORE_LINK, '_blank')
  }, [])

  const menuItems = [
    isArtist
      ? {
          text: messages.salesSummary,
          onClick: () => goToRoute(SALES_PAGE)
        }
      : null,
    {
      text: messages.withdrawalHistory,
      onClick: () => goToRoute(WITHDRAWALS_PAGE)
    }
  ].filter(Boolean) as PopupMenuItem[]

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
    openUsdcManualTransferModal()
    track(
      make({
        eventName: Name.BUY_USDC_ADD_FUNDS_MANUALLY
      })
    )
  }

  return (
    <div className={styles.usdcContainer}>
      <div className={styles.backgroundBlueGradient}>
        <div className={styles.usdcTitleContainer}>
          <div className={styles.usdcTitle}>
            <Icon icon={LogoUSDC} size='xxxLarge' color='staticWhite' />
            <div className={styles.usdc}>
              <Text
                variant='heading'
                size='xxLarge'
                color='staticWhite'
                strength='strong'
              >
                {messages.usdc}
              </Text>
            </div>
          </div>
          <Text
            variant='heading'
            color='staticWhite'
            strength='strong'
            size='xxLarge'
          >
            ${balanceFormatted}
          </Text>
        </div>
        <div className={styles.usdcInfo}>
          <Text color='staticWhite'>
            {isArtist ? messages.earn : messages.buyAndSell}
          </Text>
          <PlainButton
            onClick={handleLearnMore}
            iconLeft={IconQuestionCircle}
            variant={PlainButtonType.INVERTED}
          >
            {messages.learnMore}
          </PlainButton>
        </div>
      </div>
      <div className={styles.withdrawContainer}>
        <div className={styles.withdrawButton}>
          <Button
            variant={ButtonType.SECONDARY}
            fullWidth
            iconLeft={IconWithdraw}
            onClick={handleWithdraw}
          >
            {messages.withdraw}
          </Button>
        </div>
        <div className={styles.addFundsButton}>
          <Button
            variant={ButtonType.SECONDARY}
            fullWidth
            onClick={handleAddFunds}
          >
            {messages.addFunds}
          </Button>
        </div>
        <PopupMenu
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          items={menuItems}
          renderTrigger={(anchorRef, triggerPopup) => (
            <Button
              ref={anchorRef}
              variant={ButtonType.SECONDARY}
              iconLeft={IconKebabHorizontal}
              onClick={() => triggerPopup()}
            />
          )}
        />
      </div>
    </div>
  )
}
