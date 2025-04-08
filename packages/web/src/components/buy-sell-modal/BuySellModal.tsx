import { useCallback, useEffect, useState } from 'react'

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
  Text
} from '@audius/harmony'
import { useTheme } from '@emotion/react'

import { BuyTab } from './BuyTab'
import { SellTab } from './SellTab'
import { SUPPORTED_TOKEN_PAIRS, TOKENS, messages } from './constants'
import { BuySellTab } from './types'

// import { useIsMobile } from 'hooks/useIsMobile' // Keep for potential mobile-specific adjustments - Removing for now

export const BuySellModal = () => {
  const { isOpen, onClose } = useBuySellModal()
  const { spacing } = useTheme()
  // const isMobile = useIsMobile() // Keep for potential mobile-specific adjustments - Removing for now
  const [activeTab, setActiveTab] = useState<BuySellTab>('buy')
  // selectedPairIndex will be used in future when multiple token pairs are supported
  const [selectedPairIndex] = useState(0)

  const tabs = [
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

  const handleTabChange = useCallback((newTab: string) => {
    setActiveTab(newTab as BuySellTab)
  }, [])

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='medium'>
      <ModalHeader onClose={onClose} showDismissButton={true}>
        <ModalTitle
          title={
            <Text variant='label' size='xl' strength='strong'>
              {messages.title}
            </Text>
          }
        />
      </ModalHeader>
      <ModalContent>
        <Flex direction='column' gap='l'>
          <Flex alignItems='center' justifyContent='space-between'>
            <SegmentedControl
              options={tabs}
              selected={activeTab}
              onSelectOption={handleTabChange}
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
            <Text
              variant='body'
              color='accent'
              css={{ textDecoration: 'underline' }}
            >
              {messages.walletGuide}
            </Text>
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
          borderTop: '1px solid var(--harmony-border-strong)',
          backgroundColor: 'var(--harmony-bg-surface-1)'
        }}
      >
        <Text variant='label' size='xs' color='subdued'>
          {messages.poweredBy}
        </Text>
      </ModalFooter>
    </Modal>
  )
}
