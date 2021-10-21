import React, { memo } from 'react'

import AnimatedBottomButton from './AnimatedBottomButton'
import { ButtonProps } from './types'

const ExploreButton = ({ isDarkMode, onClick, isActive }: ButtonProps) => {
  return (
    <AnimatedBottomButton
      uniqueKey='explore-button'
      isActive={isActive}
      isDarkMode={isDarkMode}
      onClick={onClick}
      iconLightJSON={() => require('assets/animations/iconExploreLight.json')}
      iconDarkJSON={() => require('assets/animations/iconExploreDark.json')}
    />
  )
}

export default memo(ExploreButton)
