import React from 'react'
import cn from 'classnames'

import styles from './MoreButton.module.css'

import moreDark from 'assets/img/iconMoreDark@2x.png'
import moreLight from 'assets/img/iconMoreLight@2x.png'

type MoreButtonProps = {
  onClick: () => void
  isDarkMode: boolean
  className?: string
  stopPropagation?: boolean
}

const iconMap = {
  dark: moreDark,
  light: moreLight
}

const MoreButton = ({
  onClick,
  isDarkMode,
  className,
  stopPropagation = true
}: MoreButtonProps) => {
  const icon = iconMap[isDarkMode ? 'dark' : 'light']

  return (
    <div
      className={cn(styles.icon, className)}
      style={{
        backgroundImage: `url(${icon})`
      }}
      onClick={e => {
        onClick()
        stopPropagation && e.stopPropagation()
      }}
    />
  )
}

export default MoreButton
