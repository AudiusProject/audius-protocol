import { StyleSheet, View } from 'react-native'

import { GradientText } from 'app/components/core'

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    paddingTop: 10,
    paddingLeft: 12
  },
  text: {
    fontSize: 24,
    textShadowColor: 'rgba(126, 27, 204, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4
  }
})

type HeaderProps = {
  text: string
}

const Header = ({ text }: HeaderProps) => {
  return (
    <View style={styles.container}>
      <GradientText style={styles.text}>{text}</GradientText>
    </View>
  )
}

export default Header
