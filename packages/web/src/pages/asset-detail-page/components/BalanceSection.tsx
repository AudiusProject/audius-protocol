import { ComponentType } from 'react'

import { useAudioBalance } from '@audius/common/api'
import { useFormattedAudioBalance } from '@audius/common/hooks'
import { walletMessages } from '@audius/common/messages'
import {
  tokenDashboardPageActions,
  useAddCashModal,
  useBuySellModal
} from '@audius/common/store'
import { Button, Flex, Paper, Text, useTheme } from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { useIsMobile } from 'hooks/useIsMobile'

import { ACCEPTED_ROUTES } from '../constants'
import { AssetDetailProps } from '../types'

type BalanceStateProps = {
  title: string
  icon?: ComponentType<any>
  onBuy?: () => void
  onReceive?: () => void
  onSend?: () => void
}

const TokenIcon = ({ icon: Icon }: { icon?: ComponentType<any> }) => {
  if (!Icon) return null
  return <Icon size='4xl' hex />
}

const ZeroBalanceState = ({
  title,
  icon,
  onBuy,
  onReceive
}: BalanceStateProps) => {
  return (
    <>
      <Flex gap='s' alignItems='center'>
        <TokenIcon icon={icon} />
        <Text variant='heading' size='l' color='subdued'>
          {title}
        </Text>
      </Flex>
      <Flex gap='s'>
        <Button variant='primary' fullWidth onClick={onBuy}>
          {walletMessages.buy}
        </Button>
        <Button variant='secondary' fullWidth onClick={onReceive}>
          {walletMessages.receive}
        </Button>
      </Flex>
    </>
  )
}

const HasBalanceState = ({
  title,
  icon,
  onBuy,
  onSend,
  onReceive
}: BalanceStateProps) => {
  const { motion } = useTheme()
  const {
    audioBalanceFormatted,
    audioDollarValue,
    isAudioBalanceLoading,
    isAudioPriceLoading
  } = useFormattedAudioBalance()

  const isLoading = isAudioBalanceLoading || isAudioPriceLoading

  return (
    <>
      <Flex gap='s' alignItems='center'>
        <TokenIcon icon={icon} />
        <Flex
          direction='column'
          gap='xs'
          css={{
            opacity: isLoading ? 0 : 1,
            transition: `opacity ${motion.expressive}`
          }}
        >
          <Flex gap='xs'>
            <Text variant='heading' size='l' color='default'>
              {audioBalanceFormatted}
            </Text>
            <Text variant='heading' size='l' color='subdued'>
              {title}
            </Text>
          </Flex>
          <Text variant='heading' size='s' color='subdued'>
            {audioDollarValue}
          </Text>
        </Flex>
      </Flex>
      <Flex direction='column' gap='s'>
        <Button variant='secondary' fullWidth onClick={onBuy}>
          {walletMessages.buySell}
        </Button>
        <Flex gap='s'>
          <Button variant='secondary' fullWidth onClick={onSend}>
            {walletMessages.send}
          </Button>
          <Button variant='secondary' fullWidth onClick={onReceive}>
            {walletMessages.receive}
          </Button>
        </Flex>
      </Flex>
    </>
  )
}

export const BalanceSection = ({ mint }: AssetDetailProps) => {
  const { totalBalance } = useAudioBalance()
  const { title, icon } = ACCEPTED_ROUTES[mint]

  // Modal hooks
  const { onOpen: openBuySellModal } = useBuySellModal()
  const { onOpen: openAddCashModal } = useAddCashModal()
  const [, openTransferDrawer] = useModalState('TransferAudioMobileWarning')

  // Redux and mobile detection
  const dispatch = useDispatch()
  const isMobile = useIsMobile()

  // Action destructuring
  const { pressReceive, pressSend } = tokenDashboardPageActions

  // Handler functions
  const handleBuySell = () => {
    // Has balance - show buy/sell modal
    openBuySellModal()
  }

  const handleAddCash = () => {
    // No balance - show add cash modal (uses Coinflow)
    openAddCashModal()
  }

  const handleReceive = () => {
    if (isMobile) {
      openTransferDrawer(true)
    } else {
      dispatch(pressReceive())
    }
  }

  const handleSend = () => {
    if (isMobile) {
      openTransferDrawer(true)
    } else {
      dispatch(pressSend())
    }
  }

  return (
    <Paper ph='xl' pv='l'>
      <Flex direction='column' gap='l' w='100%'>
        {!totalBalance ? (
          <ZeroBalanceState
            title={title}
            icon={icon}
            onBuy={handleAddCash}
            onReceive={handleReceive}
          />
        ) : (
          <HasBalanceState
            title={title}
            icon={icon}
            onBuy={handleBuySell}
            onSend={handleSend}
            onReceive={handleReceive}
          />
        )}
      </Flex>
    </Paper>
  )
}
