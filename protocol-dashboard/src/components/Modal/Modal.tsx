import React, { ReactNode } from 'react'

import { IconRemove, Modal as StemsModal } from '@audius/stems'
import clsx from 'clsx'

import styles from './Modal.module.css'

interface ModalProps {
  className?: string
  wrapperClassName?: string
  headerClassName?: string
  title: string
  titleRightElement?: ReactNode
  isOpen: boolean
  onClose: () => void
  allowScroll?: boolean
  isCloseable?: boolean
  dismissOnClickOutside?: boolean
  children: ReactNode
}

const Modal = ({
  className,
  wrapperClassName,
  headerClassName,
  title,
  titleRightElement,
  isOpen,
  isCloseable,
  dismissOnClickOutside,
  onClose,
  allowScroll,
  children
}: ModalProps) => {
  return (
    <StemsModal
      wrapperClassName={clsx(styles.container, {
        [wrapperClassName!]: !!wrapperClassName
      })}
      bodyClassName={clsx(styles.bodyClassName, { [className!]: !!className })}
      dismissOnClickOutside={dismissOnClickOutside}
      onClose={onClose}
      allowScroll={allowScroll}
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
