import { forwardRef } from 'react'

import cn from 'classnames'

import styles from './ModalFooter.module.css'
import { ModalFooterProps } from './types'

/**
 * Footer component to be used inside modals
 */
export const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(
  function ModalFooter({ className, children, ...props }, ref) {
    return (
      <div
        className={cn(styles.modalFooterContainer, className)}
        {...props}
        ref={ref}
      >
        {children}
      </div>
    )
  }
)
