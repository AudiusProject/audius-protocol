import { ReactNode } from 'react'

import cn from 'classnames'

import styles from './ModalRadio.module.css'

type ModalRadioItemProps = {
  children: ReactNode
  selected: boolean
  onClick: (e: any) => void
  disabled?: boolean
  className?: string
}

export const ModalRadioItem = ({
  selected,
  onClick,
  children,
  disabled = false,
  className
}: ModalRadioItemProps) => {
  return (
    <div
      className={cn(
        styles.radioItem,
        { [styles.selected]: selected, [styles.disabled]: disabled },
        className
      )}
    >
      <div className={styles.radioItemContent} onClick={onClick}>
        {children}
      </div>
    </div>
  )
}
