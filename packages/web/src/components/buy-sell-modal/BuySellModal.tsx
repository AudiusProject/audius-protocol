import { useCallback, useEffect, useState } from 'react'

import { buySellMessages as messages } from '@audius/common/messages'
import { useBuySellModal } from '@audius/common/store'
import {
  Button,
  Flex,
  Hint,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  SegmentedControl,
  Text,
  TextLink
} from '@audius/harmony'
import { useTheme } from '@emotion/react'

import { BuyTab } from './BuyTab'
import { SellTab } from './SellTab'
import { SUPPORTED_TOKEN_PAIRS, TOKENS } from './constants'
import { BuySellTab } from './types'

type TabOption = {
  key: BuySellTab
  text: string
}

export const BuySellModal = () => {
  const { isOpen, onClose } = useBuySellModal()
  const { spacing, color } = useTheme()
  const [activeTab, setActiveTab] = useState<BuySellTab>('buy')
  // selectedPairIndex will be used in future when multiple token pairs are supported
  const [selectedPairIndex] = useState(0)

  const tabs: TabOption[] = [
    { key: 'buy', text: messages.buy },
    { key: 'sell', text: messages.sell }
  ]

  // Update token balances (placeholder - would connect to wallet)
  useEffect(() => {
    // This would be replaced with actual balance fetching logic
    TOKENS.AUDIO.balance = 15000.0
    TOKENS.USDC.balance = 100.0
  }, [])

  const selectedPair = SUPPORTED_TOKEN_PAIRS[selectedPairIndex]

  const handleActiveTabChange = useCallback((newTab: BuySellTab) => {
    setActiveTab(newTab)
  }, [])

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='medium'>
      <ModalHeader onClose={onClose} showDismissButton={true}>
        <ModalTitle title={messages.title} />
      </ModalHeader>
      <ModalContent>
        <Flex direction='column' gap='l'>
          <Flex alignItems='center' justifyContent='space-between'>
            <SegmentedControl
              options={tabs}
              selected={activeTab}
              onSelectOption={handleActiveTabChange}
              css={{ flex: 1 }}
            />
          </Flex>

          {activeTab === 'buy' ? (
            <BuyTab tokenPair={selectedPair} />
          ) : (
            <SellTab tokenPair={selectedPair} />
          )}

          <Hint>
            {messages.helpCenter}{' '}
            <TextLink
              variant='visible'
              href='#' // Replace with actual URL when available
            >
              {messages.walletGuide}
            </TextLink>
          </Hint>

          <Button variant='primary' fullWidth>
            {messages.continue}
          </Button>
        </Flex>
      </ModalContent>
      <ModalFooter
        css={{
          justifyContent: 'center',
          gap: spacing.s,
          borderTop: `1px solid ${color.border.strong}`,
          backgroundColor: color.background.surface1
        }}
      >
        <Text variant='label' size='xs' color='subdued'>
          {messages.poweredBy}
        </Text>
      </ModalFooter>
    </Modal>
  )
}
