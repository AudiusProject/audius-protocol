import { useCallback } from 'react'

import type { IconJSON } from 'app/components/core'
import { AnimatedButton } from 'app/components/core'
import { makeStyles } from 'app/styles'

import { BOTTOM_BAR_BUTTON_HEIGHT } from '../constants'

export type BaseBottomTabBarButtonProps = {
  isActive: boolean
  onPress: (isActive: boolean, routeName: string, routeKey: string) => void
  onLongPress: () => void
  routeKey: string
}

export type BottomTabBarButtonProps = BaseBottomTabBarButtonProps & {
  name: string
  iconJSON: IconJSON
}

const hitSlop = { top: 0, right: 0, bottom: 0, left: 0 }

const useStyles = makeStyles(() => ({
  animatedButton: {
    width: '20%',
    alignItems: 'center'
  },
  iconWrapper: {
    width: 28,
    height: BOTTOM_BAR_BUTTON_HEIGHT
  },
  underlay: {
    width: '100%',
    height: BOTTOM_BAR_BUTTON_HEIGHT,
    position: 'absolute'
  }
}))

export const BottomTabBarButton = (props: BottomTabBarButtonProps) => {
  const { name, routeKey, isActive, iconJSON, onPress, onLongPress } = props
  const styles = useStyles()

  const handlePress = useCallback(() => {
    onPress(isActive, name, routeKey)
  }, [onPress, routeKey, isActive, name])

  const handleLongPress = isActive ? onLongPress : handlePress

  return (
    <AnimatedButton
      hitSlop={hitSlop}
      iconJSON={iconJSON}
      isActive={isActive}
      onLongPress={handleLongPress}
      onPress={handlePress}
      style={styles.animatedButton}
      wrapperStyle={styles.iconWrapper}
    />
  )
}
