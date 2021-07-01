import React, { ReactNode } from 'react'

import cn from 'classnames'

import styles from './PurpleBox.module.css'

type PurpleBoxProps = {
  label: string
  text: ReactNode
  className?: string
  onClick?: () => void
  isCompact?: boolean
}

const PurpleBox = ({
  label,
  text,
  className,
  onClick,
  isCompact = false
}: PurpleBoxProps) => {
  return (
    <div
      className={cn(styles.container, { [className!]: !!className })}
      onClick={onClick}
    >
      <div className={styles.label}>{label}</div>
      <div className={cn(styles.text, { [styles.compact]: isCompact })}>
        {text}
      </div>
    </div>
  )
}

export default PurpleBox
