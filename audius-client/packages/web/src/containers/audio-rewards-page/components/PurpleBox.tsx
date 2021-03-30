import React, { ReactNode } from 'react'
import styles from './PurpleBox.module.css'
import cn from 'classnames'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'

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
  const wm = useWithMobileStyle(styles.mobile)

  return (
    <div
      className={wm(styles.container, { [className!]: !!className })}
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
