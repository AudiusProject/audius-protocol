import {
  BNUSDC,
  Name,
  WithdrawUSDCModalPages,
  formatCurrencyBalance,
  formatUSDCWeiToFloorCentsNumber,
  useWithdrawUSDCModal
} from '@audius/common'
import {
  Button,
  ButtonType,
  IconWithdraw,
  IconKebabHorizontal,
  IconQuestionCircle
} from '@audius/harmony'
import {
  PopupMenu,
  PopupMenuItem,
  HarmonyPlainButton,
  HarmonyPlainButtonType,
  LogoUSDC
} from '@audius/stems'
import BN from 'bn.js'

import { Icon } from 'components/Icon'
import { Text } from 'components/typography'
import { useGoToRoute } from 'hooks/useGoToRoute'
import { make, track } from 'services/analytics'
import { SALES_PAGE, WITHDRAWALS_PAGE } from 'utils/route'

import styles from './USDCCard.module.css'

const messages = {
  usdc: 'USDC',
  earn: 'Earn USDC by selling your music',
  learnMore: 'Learn More',
  withdraw: 'Withdraw Funds',
  salesSummary: 'Sales Summary',
  withdrawalHistory: 'Withdrawal History'
}

export const USDCCard = ({ balance }: { balance: BNUSDC }) => {
  const goToRoute = useGoToRoute()
  const { onOpen: openWithdrawUSDCModal } = useWithdrawUSDCModal()

  const balanceCents = formatUSDCWeiToFloorCentsNumber(
    (balance ?? new BN(0)) as BNUSDC
  )
  const balanceFormatted = formatCurrencyBalance(balanceCents / 100)

  const menuItems: PopupMenuItem[] = [
    {
      text: messages.salesSummary,
      onClick: () => goToRoute(SALES_PAGE)
    },
    {
      text: messages.withdrawalHistory,
      onClick: () => goToRoute(WITHDRAWALS_PAGE)
    }
  ]

  const handleClickWithdraw = () => {
    openWithdrawUSDCModal({
      page: WithdrawUSDCModalPages.ENTER_TRANSFER_DETAILS
    })
    track(
      make({
        eventName: Name.WITHDRAW_USDC_MODAL_OPENED,
        currentBalance: balanceCents
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
          <Text color='staticWhite'>{messages.earn}</Text>
          <HarmonyPlainButton
            // TODO: wire up learn more link https://linear.app/audius/issue/PAY-1762/wire-up-learn-more-link
            onClick={() => {}}
            iconLeft={IconQuestionCircle}
            variant={HarmonyPlainButtonType.INVERTED}
            text={messages.learnMore}
          />
        </div>
      </div>
      <div className={styles.withdrawContainer}>
        <div className={styles.withdrawButton}>
          <Button
            variant={ButtonType.SECONDARY}
            fullWidth
            iconLeft={IconWithdraw}
            onClick={handleClickWithdraw}
          >
            {messages.withdraw}
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
