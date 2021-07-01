import React, { MouseEvent } from 'react'

import cn from 'classnames'

import shareDark from 'assets/img/iconShareDark@2x.png'
import shareMatrix from 'assets/img/iconShareInactiveMatrix@2x.png'
import shareLight from 'assets/img/iconShareLight@2x.png'

import styles from './ShareButton.module.css'

type ShareButtonProps = {
  onClick: (e: MouseEvent) => void
  isMatrixMode: boolean
  isDarkMode: boolean
  className?: string
  stopPropagation?: boolean
}

const iconMap = {
  dark: shareDark,
  light: shareLight,
  matrix: shareMatrix
}

const ShareButton = ({
  onClick,
  isDarkMode,
  className,
  isMatrixMode,
  stopPropagation = true
}: ShareButtonProps) => {
  const icon = iconMap[isMatrixMode ? 'matrix' : isDarkMode ? 'dark' : 'light']

  return (
    <div
      className={cn(styles.icon, className)}
      style={{
        backgroundImage: `url(${icon})`
      }}
      onClick={e => {
        onClick(e)
        stopPropagation && e.stopPropagation()
      }}
    />
  )
}

export default ShareButton
