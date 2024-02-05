import { ComponentProps, forwardRef, MouseEvent } from 'react'

import { IconSave } from '@audius/harmony'
import cn from 'classnames'

import styles from './Pill.module.css'

const icons = {
  save: <IconSave color='subdued' />
}

type PillProps = ComponentProps<'button'> & {
  textClassName?: string
  text: string
  showIcon?: boolean
  icon?: 'save'
  clickable?: boolean
}

const Pill = forwardRef<HTMLButtonElement, PillProps>((props, ref) => {
  const {
    clickable = true,
    onClick,
    className,
    showIcon = true,
    icon,
    textClassName,
    text,
    ...other
  } = props

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (clickable) {
      onClick?.(e)
    }
  }

  return (
    <button
      ref={ref}
      className={cn(styles.pill, className, {
        [styles.clickable]: clickable
      })}
      onClick={handleClick}
      {...other}
    >
      {showIcon && icon ? (
        <span className={styles.icon}>{icons[icon]}</span>
      ) : null}
      <span className={cn(styles.text, textClassName)}>{text}</span>
    </button>
  )
})

export default Pill
