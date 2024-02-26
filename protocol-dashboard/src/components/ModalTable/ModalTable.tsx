import React from 'react'

import SimpleBar from 'simplebar-react'

import Modal from 'components/Modal'

import styles from './ModalTable.module.css'

type OwnProps = {
  title: string
  header: string
  isOpen: boolean
  dismissOnClickOutside?: boolean
  allowScroll?: boolean
  onClose: () => void
}

type ModalTableProps = OwnProps

const ModalTable: React.FC<ModalTableProps> = ({
  title,
  header,
  isOpen,
  onClose,
  children,
  allowScroll = true,
  dismissOnClickOutside
}) => {
  return (
    <Modal
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      isCloseable
      allowScroll={allowScroll}
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
