import cn from 'classnames'

import { Scrollbar } from 'components/Scrollbar'

import styles from './ModalContent.module.css'
import { ModalContentProps } from './types'

/**
 * Container for the body of content inside a Modal.
 */
export const ModalContent = ({
  className,
  children,
  ...props
}: ModalContentProps) => {
  return (
    <Scrollbar
      className={cn(styles.modalContentContainer, className)}
      {...props}
    >
      {children}
    </Scrollbar>
  )
}
