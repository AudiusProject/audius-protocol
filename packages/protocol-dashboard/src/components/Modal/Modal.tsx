import React, { ReactNode } from 'react'
import clsx from 'clsx'
import styles from './Modal.module.css'

import { IconRemove, Modal as StemsModal } from '@audius/stems'

interface ModalProps {
  className?: string
  wrapperClassName?: string
  headerClassName?: string
  title: string
  titleRightElement?: ReactNode
  isOpen: boolean
  onClose: () => void
  isCloseable?: boolean
  dismissOnClickOutside?: boolean
}

const Modal: React.FC<ModalProps> = ({
  className,
  wrapperClassName,
  headerClassName,
  title,
  titleRightElement,
  isOpen,
  isCloseable,
  dismissOnClickOutside,
  onClose,
  children
}) => {
  return (
    <StemsModal
      wrapperClassName={clsx(styles.container, {
        [wrapperClassName!]: !!wrapperClassName
      })}
      bodyClassName={clsx(styles.bodyClassName, { [className!]: !!className })}
      dismissOnClickOutside={dismissOnClickOutside}
      onClose={onClose}
      isOpen={isOpen}
    >
      <div className={clsx(styles.header, headerClassName)}>
        {isCloseable && (
          <IconRemove className={styles.close} onClick={onClose} />
        )}
        <div className={styles.title}>{title}</div>
        {titleRightElement && (
          <div className={styles.titleRight}>{titleRightElement}</div>
        )}
      </div>
      {children}
    </StemsModal>
  )
}

export default Modal
