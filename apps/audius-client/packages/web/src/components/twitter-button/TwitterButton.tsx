import { ReactNode } from 'react'

import cn from 'classnames'

import { ReactComponent as IconTwitter } from 'assets/img/iconTwitterBird.svg'

import styles from './TwitterButton.module.css'

export type TwitterButtonProps = {
  className?: string
  iconClassName?: string
  isMobile?: boolean
  onClick: () => void
  size?: 'tiny' | 'small' | 'medium' | 'large'
  textClassName?: string
  textLabel?: string | ReactNode
}

const TwitterButton = (props: TwitterButtonProps) => {
  const {
    className,
    iconClassName,
    isMobile,
    onClick,
    size = 'medium',
    textClassName,
    textLabel
  } = props

  const buttonClassNames = cn(className, styles.button, styles.twitter, {
    [styles.verified]: textLabel === 'Verified',
    [styles.notVerified]: textLabel !== 'Verified',
    [styles.isMobile]: isMobile,
    [styles.large]: size === 'large',
    [styles.medium]: size === 'medium',
    [styles.small]: size === 'small',
    [styles.tiny]: size === 'tiny'
  })

  return (
    <div className={cn(buttonClassNames)} onClick={onClick}>
      <IconTwitter className={iconClassName} />
      <span className={cn('btnTextLabel', styles.textLabel, textClassName)}>
        {textLabel}
      </span>
    </div>
  )
}

export default TwitterButton
