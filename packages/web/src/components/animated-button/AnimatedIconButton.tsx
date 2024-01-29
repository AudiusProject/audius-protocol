import { useState, MouseEvent } from 'react'

import { uuid } from '@audius/common'

import AnimatedButtonProvider from './AnimatedButtonProvider'

export enum AnimatedIconType {
  FAVORITE = 'FAVORITE',
  FAVORITE_LIGHT = 'FAVORITE_LIGHT',
  REPOST = 'REPOST',
  REPOST_LIGHT = 'REPOST_LIGHT'
}

const animationMap = {
  [AnimatedIconType.FAVORITE]: {
    dark: 'iconFavoriteDark',
    light: 'iconFavoriteLight'
  },
  [AnimatedIconType.REPOST]: {
    dark: 'iconRepostDark',
    light: 'iconRepostLight'
  },
  [AnimatedIconType.FAVORITE_LIGHT]: {
    dark: 'iconFavoriteLighterDark',
    light: 'iconFavoriteLighterLight'
  },
  [AnimatedIconType.REPOST_LIGHT]: {
    dark: 'iconRepostLighterDark',
    light: 'iconRepostLighterLight'
  }
}

type AnimatedIconButtonProps = {
  onClick?: (e: MouseEvent) => void
  href?: string
  isDisabled?: boolean
  isActive?: boolean
  className?: string
  stopPropagation?: boolean
  activeClassName?: string
  disabledClassName?: string
  icon: AnimatedIconType
  darkMode: boolean
  isMatrix?: boolean
}

const AnimatedIconButton = ({
  onClick,
  href,
  className,
  activeClassName,
  disabledClassName,
  icon,
  darkMode,
  isMatrix = false,
  isDisabled = false,
  isActive = false,
  stopPropagation = false
}: AnimatedIconButtonProps) => {
  const { dark, light } = animationMap[icon]
  const [uniqueKey] = useState(`${uuid()}-${icon}`)
  return (
    <AnimatedButtonProvider
      uniqueKey={uniqueKey}
      isActive={isActive}
      isDisabled={isDisabled}
      darkMode={darkMode}
      isMatrix={isMatrix}
      onClick={onClick || ((e: MouseEvent) => {})}
      href={href}
      iconLightJSON={() => import(`../../assets/animations/${light}.json`)}
      iconDarkJSON={() => import(`../../assets/animations/${dark}.json`)}
      activeClassName={activeClassName}
      disabledClassName={disabledClassName}
      className={className}
      stopPropagation={stopPropagation}
    />
  )
}

export default AnimatedIconButton
