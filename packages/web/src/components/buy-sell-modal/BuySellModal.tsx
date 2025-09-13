import { useMemo, useState, useEffect } from 'react'

import { buySellMessages as messages } from '@audius/common/messages'
import { useBuySellModal, useAddCashModal } from '@audius/common/store'
import {
  IconJupiterLogo,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  Text
} from '@audius/harmony'
import { useTheme } from '@emotion/react'

import { BuySellFlow } from './BuySellFlow'
import { Screen } from './types'

export const BuySellModal = () => {
  const { isOpen, onClose, data } = useBuySellModal()
  const { mint } = data
  const { spacing, color } = useTheme()
  const { onOpen: openAddCashModal } = useAddCashModal()

  const [modalScreen, setModalScreen] = useState<Screen>('input')
  const [isFlowLoading, setIsFlowLoading] = useState(false)

  // Reset modal state when modal opens
  useEffect(() => {
    if (isOpen) {
      setModalScreen('input')
      setIsFlowLoading(false)
    }
  }, [isOpen])

  const title = useMemo(() => {
    if (isFlowLoading) return ''
    if (modalScreen === 'confirm') return messages.confirmDetails
    if (modalScreen === 'success') return messages.modalSuccessTitle
    return messages.title
  }, [isFlowLoading, modalScreen])

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='medium'>
      <ModalHeader
        onClose={onClose}
        showDismissButton={!isFlowLoading && modalScreen !== 'success'}
      >
        <ModalTitle title={title} />
      </ModalHeader>
      <ModalContent>
        <BuySellFlow
          onClose={onClose}
          openAddCashModal={openAddCashModal}
          onScreenChange={setModalScreen}
          onLoadingStateChange={setIsFlowLoading}
          initialMint={mint}
        />
      </ModalContent>
      {modalScreen !== 'success' && !isFlowLoading && (
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
          <IconJupiterLogo />
        </ModalFooter>
      )}
    </Modal>
  )
}
