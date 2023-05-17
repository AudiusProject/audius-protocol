import { ComponentProps, forwardRef, MouseEvent } from 'react'

import cn from 'classnames'

import { ReactComponent as IconSave } from 'assets/img/iconSave.svg'

import styles from './Pill.module.css'

const icons = {
  save: <IconSave />
}

type PillProps = ComponentProps<'span'> & {
  textClassName?: string
  text: string
  showIcon?: boolean
  icon?: 'save'
  clickable?: boolean
}

const Pill = forwardRef<HTMLSpanElement, PillProps>((props, ref) => {
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

  const handleClick = (e: MouseEvent<HTMLSpanElement>) => {
    if (clickable) {
      onClick?.(e)
    }
  }

  return (
    <span
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
    </span>
  )
})

export default Pill
