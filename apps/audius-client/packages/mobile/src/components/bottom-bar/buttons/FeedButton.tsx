import React, { memo } from 'react'

import AnimatedBottomButton from './AnimatedBottomButton'
import { ButtonProps } from './types'

const FeedButton = ({ isDarkMode, onClick, isActive }: ButtonProps) => {
  return (
    <AnimatedBottomButton
      uniqueKey='feed-button'
      isActive={isActive}
      isDarkMode={isDarkMode}
      onClick={onClick}
      iconLightJSON={() => require('assets/animations/iconFeedLight.json')}
      iconDarkJSON={() => require('assets/animations/iconFeedDark.json')}
    />
  )
}

export default memo(FeedButton)
