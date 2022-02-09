import { useCallback, useEffect, useRef } from 'react'

import { Animated } from 'react-native'

import IconCaretRight from 'app/assets/images/iconCaretRight.svg'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { IconButton } from '../core'

const useStyles = makeStyles(() => ({
  icon: {
    height: 28,
    width: 28,
    transform: [{ rotate: '180deg' }]
  }
}))

export const TopBarArrowBack = ({ onPress }) => {
  const styles = useStyles()
  const { neutralLight4 } = useThemeColors()
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true
    }).start()
  }, [fadeAnim])

  const handlePress = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true
    }).start()
    onPress()
  }, [fadeAnim, onPress])

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <IconButton
        icon={IconCaretRight}
        fill={neutralLight4}
        styles={{ icon: styles.icon }}
        onPress={handlePress}
      />
    </Animated.View>
  )
}
