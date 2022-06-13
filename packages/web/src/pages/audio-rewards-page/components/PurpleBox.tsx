import { ReactNode } from 'react'

import cn from 'classnames'

import { useWithMobileStyle } from 'hooks/useWithMobileStyle'

import styles from './PurpleBox.module.css'

type PurpleBoxProps = {
  label?: ReactNode
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
      {label && <div className={wm(styles.label)}>{label}</div>}
      <div className={cn(wm(styles.text), { [styles.compact]: isCompact })}>
        {text}
      </div>
    </div>
  )
}

export default PurpleBox
