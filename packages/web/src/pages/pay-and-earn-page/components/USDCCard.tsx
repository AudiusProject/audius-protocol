import { useCallback } from 'react'

import {
  BNUSDC,
  Name,
  WithdrawUSDCModalPages,
  formatCurrencyBalance,
  formatUSDCWeiToFloorCentsNumber,
  useWithdrawUSDCModal,
  useAddFundsModal
} from '@audius/common'
import {
  Button,
  ButtonType,
  PlainButton,
  IconQuestionCircle,
  PlainButtonType,
  Flex
} from '@audius/harmony'
import { LogoUSDC } from '@audius/stems'
import BN from 'bn.js'

import { Icon } from 'components/Icon'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { Text } from 'components/typography'
import { make, track } from 'services/analytics'

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
  refreshing = false
}: {
  balance: BNUSDC
  refreshing?: boolean
}) => {
  const { onOpen: openWithdrawUSDCModal } = useWithdrawUSDCModal()
  const { onOpen: openAddFundsModal } = useAddFundsModal()

  const balanceCents = formatUSDCWeiToFloorCentsNumber(
    (balance ?? new BN(0)) as BNUSDC
  )
  const balanceFormatted = formatCurrencyBalance(balanceCents / 100)

  const handleLearnMore = useCallback(() => {
    window.open(LEARN_MORE_LINK, '_blank')
  }, [])

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

          <Flex gap='m'>
            {refreshing && <LoadingSpinner className={styles.spinner} />}
            <Text
              variant='heading'
              color='staticWhite'
              strength='strong'
              size='xxLarge'
            >
              ${balanceFormatted}
            </Text>
          </Flex>
        </div>
        <div className={styles.usdcInfo}>
          <Text color='staticWhite'>{messages.buyAndSell}</Text>
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
        <div className={styles.addFundsButton}>
          <Button
            variant={ButtonType.SECONDARY}
            fullWidth
            onClick={handleAddFunds}
          >
            {messages.addFunds}
          </Button>
        </div>
        <div className={styles.withdrawButton}>
          <Button
            variant={ButtonType.SECONDARY}
            fullWidth
            onClick={handleWithdraw}
          >
            {messages.withdraw}
          </Button>
        </div>
      </div>
    </div>
  )
}
