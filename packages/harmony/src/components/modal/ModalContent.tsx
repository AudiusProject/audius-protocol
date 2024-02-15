import { useContext } from 'react'

import cn from 'classnames'

import { Scrollbar } from '../scrollbar'

import styles from './ModalContent.module.css'
import { ModalContext } from './ModalContext'
import { ModalContentProps } from './types'

/**
 * Container for the body of content inside a Modal.
 */
export const ModalContent = ({
  className,
  children,
  ...props
}: ModalContentProps) => {
  const { isDoneOpening } = useContext(ModalContext)
  return (
    <Scrollbar
      isHidden={!isDoneOpening}
      className={cn(styles.modalContentContainer, className)}
      {...props}
    >
      {children}
    </Scrollbar>
  )
}
