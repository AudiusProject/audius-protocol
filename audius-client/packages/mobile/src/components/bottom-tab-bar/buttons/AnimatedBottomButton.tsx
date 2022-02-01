import { StyleSheet } from 'react-native'

import AnimatedButtonProvider, {
  AnimatedButtonProviderProps
} from 'app/components/animated-button/AnimatedButtonProvider'

const styles = StyleSheet.create({
  animatedButton: {
    width: '20%',
    display: 'flex',
    alignItems: 'center'
  },
  iconWrapper: {
    width: 28,
    height: 49
  }
})

const AnimatedBottomButton = (
  props: Omit<AnimatedButtonProviderProps, 'style' | 'wrapperStyle'>
) => {
  return (
    <AnimatedButtonProvider
      {...props}
      showUnderlay
      style={styles.animatedButton}
      wrapperStyle={styles.iconWrapper}
    />
  )
}

export default AnimatedBottomButton
