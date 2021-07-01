import React, { memo } from 'react'

import AnimatedBottomButton from './AnimatedBottomButton'
import { ButtonProps } from './types'

const FavoritesButton = ({
  darkMode,
  onClick,
  isActive,
  isMatrixMode
}: ButtonProps) => {
  return (
    <AnimatedBottomButton
      uniqueKey='favorites-button'
      isActive={isActive}
      darkMode={darkMode}
      isMatrix={isMatrixMode}
      onClick={onClick}
      iconLightJSON={() => require('assets/animations/iconFavoriteLight.json')}
      iconDarkJSON={() => require('assets/animations/iconFavoriteDark.json')}
    />
  )
}

export default memo(FavoritesButton)
