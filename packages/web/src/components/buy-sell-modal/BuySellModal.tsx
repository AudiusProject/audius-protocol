import { useMemo, useState } from 'react'

import { buySellMessages as messages } from '@audius/common/messages'
import { useBuySellModal, useAddFundsModal } from '@audius/common/store'
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

export const BuySellModal = () => {
  const { isOpen, onClose } = useBuySellModal()
  const { spacing, color } = useTheme()
  const { onOpen: openAddFundsModal } = useAddFundsModal()

  // State to control the modal title based on the flow screen
  const [modalScreen, setModalScreen] = useState<'input' | 'confirm'>('input')
  const [isFlowLoading, setIsFlowLoading] = useState(false)

  const title = useMemo(() => {
    if (isFlowLoading) return ''
    if (modalScreen === 'confirm') return messages.confirmDetails
    return messages.title
  }, [isFlowLoading, modalScreen])

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='medium'>
      <ModalHeader onClose={onClose} showDismissButton={!isFlowLoading}>
        <ModalTitle title={title} />
      </ModalHeader>
      <ModalContent>
        <BuySellFlow
          onClose={onClose}
          openAddFundsModal={openAddFundsModal}
          onScreenChange={setModalScreen}
          onLoadingStateChange={setIsFlowLoading}
        />
      </ModalContent>
      {!isFlowLoading && (
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
