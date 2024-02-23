import { useCallback } from 'react'

import { useLeavingAudiusModal } from '@audius/common/store'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  Button,
  IconExternalLink,
  IconInfo
} from '@audius/harmony'

import { Icon } from 'components/Icon'
import { Text } from 'components/typography'

import { HelpCallout } from '../help-callout/HelpCallout'

import styles from './LeavingAudiusModal.module.css'

const messages = {
  title: 'Are You Sure?',
  body: 'This link is taking you to the following website',
  goBack: 'Go Back',
  visitSite: 'Visit Site'
}

export const LeavingAudiusModal = () => {
  const { isOpen, data, onClose, onClosed } = useLeavingAudiusModal()
  const { link } = data
  const handleOpen = useCallback(() => {
    window.open(link, '_blank', 'noreferrer,noopener')
    onClose()
  }, [link, onClose])
  return (
    <Modal
      bodyClassName={styles.modalBody}
      isOpen={isOpen}
      onClose={onClose}
      onClosed={onClosed}
      size={'small'}
    >
      <ModalHeader>
        <ModalTitle icon={<Icon icon={IconInfo} />} title={messages.title} />
      </ModalHeader>
      <ModalContent className={styles.content}>
        <Text>{messages.body}</Text>
        <HelpCallout
          className={styles.hint}
          contentClassName={styles.hintContent}
          icon={<IconExternalLink />}
          content={link}
        />
      </ModalContent>
      <ModalFooter className={styles.footer}>
        <Button className={styles.button} variant='secondary' onClick={onClose}>
          {messages.goBack}
        </Button>
        <Button className={styles.button} onClick={handleOpen}>
          {messages.visitSite}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
