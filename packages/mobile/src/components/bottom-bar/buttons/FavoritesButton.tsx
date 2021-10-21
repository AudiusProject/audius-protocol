import React, { memo } from 'react'

import AnimatedBottomButton from './AnimatedBottomButton'
import { ButtonProps } from './types'

const FavoritesButton = ({ isDarkMode, onClick, isActive }: ButtonProps) => {
  return (
    <AnimatedBottomButton
      uniqueKey='favorites-button'
      isActive={isActive}
      isDarkMode={isDarkMode}
      onClick={onClick}
      iconLightJSON={() => require('assets/animations/iconFavoriteLight.json')}
      iconDarkJSON={() => require('assets/animations/iconFavoriteDark.json')}
    />
  )
}

export default memo(FavoritesButton)
