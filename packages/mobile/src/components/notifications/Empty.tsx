import React from 'react'
import { View, StyleSheet, Text } from 'react-native'
import IconAnnouncement from '../../assets/images/iconAnnouncement.svg'
import { useTheme } from '../../utils/theme'

const messages = {
  empty: 'There’s Nothing Here Yet!'
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  text: {
    fontFamily: 'AvenirNextLTPro-Bold',
    fontSize: 16,
    marginTop: 20
  }
})

const Empty = () => {
  const textStyle = useTheme(styles.text, {
    color: 'neutral'
  })
  return (
    <View style={styles.container}>
      <IconAnnouncement width={60} height={60} />
      <Text style={textStyle}>{messages.empty}</Text>
    </View>
  )
}

export default Empty
