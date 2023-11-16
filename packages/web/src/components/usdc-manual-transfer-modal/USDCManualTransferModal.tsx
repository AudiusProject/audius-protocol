import { useCallback } from 'react'

import {
  useUSDCManualTransferModal,
  useCreateUserbankIfNeeded
} from '@audius/common'
import { ModalContent, ModalHeader } from '@audius/stems'
import cn from 'classnames'

import { Text } from 'components/typography'
import ModalDrawer from 'pages/audio-rewards-page/components/modals/ModalDrawer'
import { track } from 'services/analytics'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { isMobile } from 'utils/clientUtil'
import zIndex from 'utils/zIndex'

import styles from './USDCManualTransferModal.module.css'
import { USDCManualTransfer } from 'components/usdc-manual-transfer/USDCManualTransfer'

const messages = {
  title: 'Crypto Transfer',
}

export const USDCManualTransferModal = () => {
  useCreateUserbankIfNeeded({
    recordAnalytics: track,
    audiusBackendInstance,
    mint: 'usdc'
  })
  const { isOpen, onClose } = useUSDCManualTransferModal()
  const mobile = isMobile()

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <ModalDrawer
      zIndex={zIndex.USDC_MANUAL_TRANSFER_MODAL}
      size={'small'}
      onClose={handleClose}
      isOpen={isOpen}
      bodyClassName={styles.modal}
      useGradientTitle={false}
      dismissOnClickOutside
      isFullscreen={false}
    >
      <ModalHeader
        className={cn(styles.modalHeader, { [styles.mobile]: mobile })}
        onClose={onClose}
        showDismissButton={!mobile}
      >
        <Text
          variant='label'
          color='neutralLight2'
          size='xLarge'
          strength='strong'
          className={styles.title}
        >
          {messages.title}
        </Text>
      </ModalHeader>
      <ModalContent>
        <USDCManualTransfer onClose={handleClose} />
      </ModalContent>
    </ModalDrawer>
  )
}
