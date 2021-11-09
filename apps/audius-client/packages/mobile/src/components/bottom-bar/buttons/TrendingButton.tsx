import React, { memo } from 'react'

import AnimatedBottomButton from './AnimatedBottomButton'
import { ButtonProps } from './types'

const TrendingButton = ({ isDarkMode, onClick, isActive }: ButtonProps) => {
  return (
    <AnimatedBottomButton
      uniqueKey='trending-button'
      isActive={isActive}
      isDarkMode={isDarkMode}
      onClick={onClick}
      iconLightJSON={() =>
        require('app/assets/animations/iconTrendingLight.json')
      }
      iconDarkJSON={() =>
        require('app/assets/animations/iconTrendingDark.json')
      }
    />
  )
}

export default memo(TrendingButton)
