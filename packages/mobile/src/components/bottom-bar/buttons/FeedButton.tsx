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
      iconLightJSON={() => require('app/assets/animations/iconFeedLight.json')}
      iconDarkJSON={() => require('app/assets/animations/iconFeedDark.json')}
    />
  )
}

export default memo(FeedButton)
