import React from 'react'

import { StyleSheet, View } from 'react-native'

import GradientText from 'app/components/gradient-text'

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
      <GradientText text={text} style={styles.text} />
    </View>
  )
}

export default Header
