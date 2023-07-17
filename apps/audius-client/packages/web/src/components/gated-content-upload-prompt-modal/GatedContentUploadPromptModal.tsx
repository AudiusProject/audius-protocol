import { useCallback, useEffect, useState } from 'react'

import {
  Button,
  ButtonType,
  IconArrow,
  IconRocket,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle
} from '@audius/stems'
import { useAsync } from 'react-use'

import { ReactComponent as IconExternalLink } from 'assets/img/iconExternalLink.svg'
import { localStorage } from 'services/local-storage'

import styles from './GatedContentUploadPromptModal.module.css'

const messages = {
  title: 'NEW UPDATE!',
  subtitle: 'Control who has access to your tracks!',
  description:
    'Availability settings allow you to limit access to specific groups of users or offer exclusive content to your most dedicated fans.',
  learnMore: 'Learn More',
  gotIt: 'Got It',
  checkItOut: 'Check It Out'
}

const GATED_CONTENT_UPLOAD_PROMPT_MODAL_SEEN_KEY =
  'gated_content_upload_prompt_modal_seen'

const LEARN_MORE_URL =
  'https://blog.audius.co/article/guide-to-audius-availability-settings'

type GatedContentUploadPromptModalProps = {
  onSubmit: () => void
}

export const GatedContentUploadPromptModal = ({
  onSubmit
}: GatedContentUploadPromptModalProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const { value: seen } = useAsync(() =>
    localStorage.getItem(GATED_CONTENT_UPLOAD_PROMPT_MODAL_SEEN_KEY)
  )

  useEffect(() => {
    const shouldOpen = seen === null
    if (shouldOpen) {
      setIsOpen(true)
      localStorage.setItem(GATED_CONTENT_UPLOAD_PROMPT_MODAL_SEEN_KEY, 'true')
    }
  }, [seen, setIsOpen])

  const handleSubmit = useCallback(() => {
    onSubmit()
    setIsOpen(false)
  }, [onSubmit, setIsOpen])

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      bodyClassName={styles.modalBody}
    >
      <ModalHeader
        onClose={() => setIsOpen(false)}
        className={styles.modalHeader}
        dismissButtonClassName={styles.modalHeaderDismissButton}
      >
        <ModalTitle
          title={messages.title}
          icon={<IconRocket className={styles.modalTitleIcon} />}
        />
      </ModalHeader>
      <ModalContent>
        <p className={styles.subtitle}>{messages.subtitle}</p>
        <p className={styles.description}>{messages.description}</p>
        <Button
          type={ButtonType.TEXT}
          className={styles.learnMoreButton}
          text={messages.learnMore}
          onClick={() => window.open(LEARN_MORE_URL, '_blank')}
          iconClassName={styles.learnMoreIcon}
          rightIcon={<IconExternalLink />}
        />
        <div className={styles.buttonsContainer}>
          <Button
            type={ButtonType.COMMON_ALT}
            className={styles.button}
            textClassName={styles.buttonText}
            text={messages.gotIt}
            onClick={() => setIsOpen(false)}
          />
          <Button
            type={ButtonType.PRIMARY}
            className={styles.button}
            text={messages.checkItOut}
            onClick={handleSubmit}
            rightIcon={<IconArrow />}
          />
        </div>
      </ModalContent>
    </Modal>
  )
}
