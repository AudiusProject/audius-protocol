import React, { memo } from 'react'

import AnimatedBottomButton from './AnimatedBottomButton'
import { ButtonProps } from './types'

const ProfileButton = ({ isDarkMode, onClick, isActive }: ButtonProps) => {
  return (
    <AnimatedBottomButton
      uniqueKey='profile-button'
      isActive={isActive}
      isDarkMode={isDarkMode}
      onClick={onClick}
      iconLightJSON={() =>
        require('app/assets/animations/iconProfileLight.json')
      }
      iconDarkJSON={() => require('app/assets/animations/iconProfileDark.json')}
    />
  )
}

export default memo(ProfileButton)
