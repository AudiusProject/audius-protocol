import React, { PropsWithChildren, ReactElement, useState } from 'react'

import {
  Button,
  ButtonType,
  IconCaretRight,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle
} from '@audius/stems'
import { useFormikContext } from 'formik'

import styles from './ModalField.module.css'

const messages = {
  done: 'Done'
}

type ModalFieldProps = PropsWithChildren & {
  title: string
  icon: ReactElement
  preview: ReactElement
}

export const ModalField = (props: ModalFieldProps) => {
  const { children, title, icon, preview } = props
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { submitForm, resetForm } = useFormikContext()

  const open = () => setIsModalOpen(true)
  const close = () => setIsModalOpen(false)
  const cancel = () => {
    resetForm()
    close()
  }

  const modal = (
    <div className={styles.modal}>
      <Modal onClose={cancel} isOpen={isModalOpen}>
        <ModalHeader>
          <div className={styles.modalHeader}>
            <ModalTitle
              className={styles.modalTitle}
              title={title}
              icon={icon}
            />
          </div>
        </ModalHeader>
        <ModalContent>{children}</ModalContent>
        <ModalFooter>
          <Button
            type={ButtonType.PRIMARY}
            text={messages.done}
            onClick={() => {
              submitForm()
              close()
            }}
            buttonType='submit'
          />
        </ModalFooter>
      </Modal>
    </div>
  )

  return (
    <>
      <div className={styles.previewTile} onClick={open}>
        {preview}
        <IconCaretRight className={styles.caret} />
      </div>
      {modal}
    </>
  )
}
