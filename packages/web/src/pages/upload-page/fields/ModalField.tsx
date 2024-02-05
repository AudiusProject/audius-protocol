import { PropsWithChildren, ReactElement, useState } from 'react'

import { Button } from '@audius/harmony'
import {
  IconCaretRight,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle
} from '@audius/stems'
import { useFormikContext } from 'formik'
import { isEmpty } from 'lodash'

import { Tile } from 'components/tile/Tile'

import styles from './ModalField.module.css'

const messages = {
  save: 'Save'
}

type ModalFieldProps = PropsWithChildren & {
  title: string
  icon: ReactElement
  preview: ReactElement
}

export const ModalField = (props: ModalFieldProps) => {
  const { children, title, icon, preview } = props
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { submitForm, resetForm, errors } = useFormikContext()

  const open = () => setIsModalOpen(true)
  const close = () => setIsModalOpen(false)
  const cancel = () => {
    resetForm()
    close()
  }

  const modal = (
    <Modal onClose={cancel} isOpen={isModalOpen} bodyClassName={styles.root}>
      <ModalHeader>
        <div className={styles.modalHeader}>
          <ModalTitle className={styles.modalTitle} title={title} icon={icon} />
        </div>
      </ModalHeader>
      <ModalContent>{children}</ModalContent>
      <ModalFooter>
        <Button
          variant='primary'
          onClick={() => {
            submitForm()
            isEmpty(errors) && close()
          }}
          type='submit'
        >
          {messages.save}
        </Button>
      </ModalFooter>
    </Modal>
  )

  return (
    <Tile onClick={open} className={styles.previewTile} elevation='flat'>
      {preview}
      <IconCaretRight className={styles.caret} />
      {modal}
    </Tile>
  )
}
