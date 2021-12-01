import React from 'react'

import { View, StyleSheet, Text, TouchableOpacity } from 'react-native'

const styles = StyleSheet.create({
  container: {}
})

type PlayBarProps = {
  onPress: () => void
}

const PlayBar = ({ onPress }: PlayBarProps) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPress}>
        <Text>Something is playing</Text>
      </TouchableOpacity>
    </View>
  )
}

export default PlayBar
