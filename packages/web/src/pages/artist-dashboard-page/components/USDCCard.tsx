import { useCallback } from 'react'

import {
  BNUSDC,
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
import { SALES_PAGE, WITHDRAWALS_PAGE } from 'utils/route'

import styles from './USDCCard.module.css'

const LEARN_MORE_LINK =
  'https://support.audius.co/help/Understanding-USDC-on-Audius'

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

  const balanceNumber =
    formatUSDCWeiToFloorCentsNumber((balance ?? new BN(0)) as BNUSDC) / 100
  const balanceFormatted = formatCurrencyBalance(balanceNumber)

  const handleLearnMore = useCallback(() => {
    window.open(LEARN_MORE_LINK, '_blank')
  }, [])

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
            onClick={handleLearnMore}
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
            onClick={() =>
              openWithdrawUSDCModal({
                page: WithdrawUSDCModalPages.ENTER_TRANSFER_DETAILS
              })
            }
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
