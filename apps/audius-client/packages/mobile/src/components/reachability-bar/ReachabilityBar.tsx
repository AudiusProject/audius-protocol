import { useEffect, useRef } from 'react'

import { getIsReachable } from 'common/store/reachability/selectors'
import { View, Animated } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'

const messages = {
  alert: 'No Internet Connection'
}

const springConfig = {
  tension: 125,
  friction: 20
}

const barHeight = 40

const useStyles = makeStyles(({ palette, typography }) => ({
  root: {
    zIndex: 2,
    position: 'absolute',
    width: '100%'
  },
  container: {
    marginTop: barHeight,
    overflow: 'hidden'
  },
  text: {
    height: barHeight,
    textAlign: 'center',
    paddingVertical: spacing(2.5),
    backgroundColor: palette.secondary,
    color: palette.staticWhite,
    opacity: 0.9,
    fontSize: typography.fontSize.medium,
    fontFamily: typography.fontByWeight.bold
  }
}))

export const ReachabilityBar = () => {
  const translationAnim = useRef(new Animated.Value(-40)).current
  const isNotReachable = useSelectorWeb(getIsReachable) === false

  const styles = useStyles()

  useEffect(() => {
    if (isNotReachable) {
      Animated.spring(translationAnim, {
        ...springConfig,
        toValue: 0,
        useNativeDriver: true
      }).start()
    } else {
      Animated.spring(translationAnim, {
        ...springConfig,
        toValue: -40,
        useNativeDriver: true
      }).start()
    }
  }, [isNotReachable, translationAnim])

  return (
    <SafeAreaView style={styles.root} edges={['top']} pointerEvents='none'>
      <View style={styles.container}>
        <Animated.Text
          style={[
            styles.text,
            { transform: [{ translateY: translationAnim }] }
          ]}
        >
          {messages.alert}
        </Animated.Text>
      </View>
    </SafeAreaView>
  )
}
