import { memo } from 'react'

import LottieView from 'lottie-react-native'
import { StyleSheet, Text, View } from 'react-native'

import { useColor } from 'app/utils/theme'

const messages = {
  title: 'Your Account is Almost Ready to Rock ',
  subtitle: 'We’re just finishing up a few things...'
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 24,
    paddingRight: 24,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    width: '100%',
    height: '100%'
  },
  title: {
    color: '#7E1BCC',
    fontFamily: 'AvenirNextLTPro-Bold',
    fontSize: 28,
    textAlign: 'center',
    lineHeight: 38,
    maxWidth: 314,
    marginBottom: 14
  },
  subtitle: {
    color: '#9849D6',
    fontFamily: 'AvenirNextLTPro-Bold',
    fontSize: 16,
    lineHeight: 25,
    textAlign: 'center',
    marginBottom: 64
  },
  spinningGlyph: {
    height: 110,
    width: 110,
    marginBottom: 16
  }
})

const SignupLoadingPage = () => {
  const spinnerColor = useColor('secondary')
  return (
    <View style={styles.container}>
      <LottieView
        style={styles.spinningGlyph}
        source={require('app/assets/animations/loadingSpinningGlyph.json')}
        autoPlay
        loop
        colorFilters={[
          {
            keypath: 'Audius Logo-01 Outlines',
            color: spinnerColor
          }
        ]}
      />
      <Text style={styles.title}>{messages.title}</Text>
      <Text style={styles.subtitle}>{messages.subtitle}</Text>
    </View>
  )
}

export default memo(SignupLoadingPage)
