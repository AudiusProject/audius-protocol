import { memo } from 'react'

import AnimatedBottomButton from './AnimatedBottomButton'
import { ButtonProps } from './types'

const FeedButton = ({
  darkMode,
  onClick,
  href,
  isActive,
  isMatrixMode
}: ButtonProps) => {
  return (
    <AnimatedBottomButton
      uniqueKey='feed-button'
      isMatrix={isMatrixMode}
      isActive={isActive}
      darkMode={darkMode}
      onClick={onClick}
      href={href}
      iconLightJSON={() => require('assets/animations/iconFeedLight.json')}
      iconDarkJSON={() => require('assets/animations/iconFeedDark.json')}
    />
  )
}

export default memo(FeedButton)
