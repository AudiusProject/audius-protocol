import React from 'react'
import SimpleBar from 'simplebar-react'
import styles from './ModalTable.module.css'
import Modal from 'components/Modal'

type OwnProps = {
  title: string
  header: string
  isOpen: boolean
  dismissOnClickOutside?: boolean
  onClose: () => void
}

type ModalTableProps = OwnProps

const ModalTable: React.FC<ModalTableProps> = ({
  title,
  header,
  isOpen,
  onClose,
  children,
  dismissOnClickOutside
}) => {
  return (
    <Modal
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      isCloseable
      dismissOnClickOutside={dismissOnClickOutside}
      className={styles.container}
    >
      <div className={styles.modalHeader}> {header}</div>
      <div className={styles.divider}></div>
      <SimpleBar style={{ width: 'calc(100% + 48px)' }}>{children}</SimpleBar>
    </Modal>
  )
}

export default ModalTable
