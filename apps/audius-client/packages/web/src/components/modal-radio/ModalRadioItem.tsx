import { ReactNode } from 'react'

import cn from 'classnames'

import styles from './ModalRadio.module.css'

type ModalRadioItemProps = {
  children: ReactNode
  selected: boolean
  onClick: (e: any) => void
  disabled?: boolean
  className?: string
  contentClassName?: string
}

export const ModalRadioItem = ({
  selected,
  onClick,
  children,
  disabled = false,
  className,
  contentClassName
}: ModalRadioItemProps) => {
  return (
    <div className={cn(styles.radioItem, className)}>
      <div
        className={cn(styles.radioItemContent, contentClassName)}
        onClick={onClick}
      >
        <span
          className={cn(styles.radioButton, {
            [styles.selected]: selected,
            [styles.disabled]: disabled
          })}
        />
        {children}
      </div>
    </div>
  )
}
