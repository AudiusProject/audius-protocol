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
      iconLightJSON={() =>
        require('app/assets/animations/iconFavoriteLight.json')
      }
      iconDarkJSON={() =>
        require('app/assets/animations/iconFavoriteDark.json')
      }
    />
  )
}

export default memo(FavoritesButton)
