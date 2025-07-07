import { memo } from 'react'

import AnimatedBottomButton from './AnimatedBottomButton'
import { ButtonProps } from './types'

const ExploreButton = ({
  darkMode,
  onClick,
  href,
  isActive,
  isMatrixMode,
  ...buttonProps
}: ButtonProps) => {
  return (
    <AnimatedBottomButton
      uniqueKey='explore-button'
      isActive={isActive}
      darkMode={darkMode}
      isMatrix={isMatrixMode}
      onClick={onClick}
      href={href}
      iconLightJSON={() =>
        import('../../../assets/animations/iconSearchExplore.json')
      }
      iconDarkJSON={() =>
        import('../../../assets/animations/iconSearchExplore.json')
      }
      {...buttonProps}
    />
  )
}

export default memo(ExploreButton)
