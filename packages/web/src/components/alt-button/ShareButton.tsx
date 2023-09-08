import { MouseEvent } from 'react'

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
  wrapperClassName?: string
  stopPropagation?: boolean
  isShareHidden?: boolean
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
  wrapperClassName,
  isMatrixMode,
  stopPropagation = true,
  isShareHidden = false
}: ShareButtonProps) => {
  const icon = iconMap[isMatrixMode ? 'matrix' : isDarkMode ? 'dark' : 'light']

  return (
    <div
      className={cn(wrapperClassName, {
        [styles.isHidden]: isShareHidden
      })}
      onClick={(e) => {
        onClick(e)
        stopPropagation && e.stopPropagation()
      }}
    >
      <div
        className={cn(styles.icon, className)}
        style={{
          backgroundImage: `url(${icon})`
        }}
      />
    </div>
  )
}

export default ShareButton
