import { memo } from 'react'

import AnimatedBottomButton from './AnimatedBottomButton'
import { ButtonProps } from './types'

const LibraryButton = ({
  darkMode,
  onClick,
  href,
  isActive,
  isMatrixMode
}: ButtonProps) => {
  return (
    <AnimatedBottomButton
      uniqueKey='library-button'
      isActive={isActive}
      darkMode={darkMode}
      isMatrix={isMatrixMode}
      onClick={onClick}
      href={href}
      iconLightJSON={() => require('assets/animations/iconFavoriteLight.json')}
      iconDarkJSON={() => require('assets/animations/iconFavoriteDark.json')}
    />
  )
}

export default memo(LibraryButton)
