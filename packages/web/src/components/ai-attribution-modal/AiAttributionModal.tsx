import { useCallback, useState } from 'react'

import { Nullable } from '@audius/common'
import { ID } from '@audius/common/models'
import {
  Button,
  ButtonSize,
  ButtonType,
  Modal,
  ModalContent,
  ModalHeader,
  ModalProps,
  ModalTitle,
  Switch,
  IconRobot
} from '@audius/stems'
import { useToggle } from 'react-use'

import { AiAttributionDropdown } from './AiAttributionDropdown'
import styles from './AiAttributionModal.module.css'

const messages = {
  title: 'AI Attribution',
  label: 'Mark this track as AI-generated',
  description:
    'If your AI-generated track was trained on an existing Audius artist, you can give them credit here. Only users who have opted-in will appear in this list.',
  done: 'Done'
}

type AiAttributionModalProps = Omit<ModalProps, 'children'> & {
  onChange: (aiAttributedUserId: ID) => void
}

export const AiAttributionModal = (props: AiAttributionModalProps) => {
  const { isOpen, onClose, onChange } = props
  const [isAttributable, toggleIsAttributable] = useToggle(false)
  const [aiAttributedUserId, setAiAttributedUserId] =
    useState<Nullable<ID>>(null)

  const handleChange = useCallback(() => {
    if (aiAttributedUserId) {
      onChange(aiAttributedUserId)
    }
    onClose()
  }, [onChange, aiAttributedUserId, onClose])

  const handleClose = useCallback(() => {
    onClose()
    toggleIsAttributable(false)
  }, [onClose, toggleIsAttributable])

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      bodyClassName={styles.root}
      dismissOnClickOutside={false}
    >
      <ModalHeader>
        <ModalTitle title={messages.title} icon={<IconRobot />} />
      </ModalHeader>
      <ModalContent className={styles.content} forward>
        <label className={styles.switchLabel}>
          <span className={styles.switchLabelText}>{messages.label}</span>
          <Switch checked={isAttributable} onChange={toggleIsAttributable} />
        </label>
        <span className={styles.description}>{messages.description}</span>
        {isAttributable ? (
          <AiAttributionDropdown
            value={aiAttributedUserId}
            onSelect={setAiAttributedUserId}
          />
        ) : null}
        <Button
          text={messages.done}
          type={ButtonType.PRIMARY}
          size={ButtonSize.MEDIUM}
          className={styles.doneButton}
          onClick={handleChange}
          disabled={isAttributable && !aiAttributedUserId}
        />
      </ModalContent>
    </Modal>
  )
}
