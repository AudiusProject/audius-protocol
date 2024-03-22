import { memo } from 'react'

import AnimatedBottomButton from './AnimatedBottomButton'
import { ButtonProps } from './types'

const LibraryButton = ({
  darkMode,
  onClick,
  href,
  isActive,
  isMatrixMode,
  ...buttonProps
}: ButtonProps) => {
  return (
    <AnimatedBottomButton
      uniqueKey='library-button'
      isActive={isActive}
      darkMode={darkMode}
      isMatrix={isMatrixMode}
      onClick={onClick}
      href={href}
      iconLightJSON={() =>
        import('../../../assets/animations/iconFavoriteLight.json')
      }
      iconDarkJSON={() =>
        import('../../../assets/animations/iconFavoriteDark.json')
      }
      {...buttonProps}
    />
  )
}

export default memo(LibraryButton)
