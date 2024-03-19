import { memo } from 'react'

import AnimatedBottomButton from './AnimatedBottomButton'
import { ButtonProps } from './types'

const ProfileButton = ({
  darkMode,
  onClick,
  href,
  isActive,
  isMatrixMode
}: ButtonProps) => {
  return (
    <AnimatedBottomButton
      uniqueKey='profile-button'
      isActive={isActive}
      darkMode={darkMode}
      isMatrix={isMatrixMode}
      onClick={onClick}
      href={href}
      aria-label='Profile Page'
      iconLightJSON={() =>
        import('../../../assets/animations/iconProfileLight.json')
      }
      iconDarkJSON={() =>
        import('../../../assets/animations/iconProfileDark.json')
      }
    />
  )
}

export default memo(ProfileButton)
