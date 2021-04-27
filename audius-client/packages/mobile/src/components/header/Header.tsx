import React from 'react'
import {
  StyleSheet,
  Text,
  View
} from 'react-native'
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    paddingTop: 10,
    paddingLeft: 12
  },
  masked: {
    height: 42
  },
  header: {
    height: '100%',
    backgroundColor: 'transparent'
  },
  text: {
    fontWeight: "900",
    fontSize: 24,
    fontFamily: 'AvenirNextLTPro-Medium',
    textShadowColor: 'rgba(126, 27, 204, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3
  }
})

type HeaderProps = {
  text: string,
  containerStyle: Object
}
/**
 * NOTE: Since masked view cannot calculate the width beforehand,
 * the width of the text must be passed in via the containerStyle prop
 */
const Header = ({
  text,
  containerStyle = {}
}: HeaderProps) => {
  return (
    <View style={styles.container}>
      <MaskedView
        style={[styles.masked, containerStyle]}
        maskElement={
          <View
            style={styles.header}
          >
            <Text
              style={styles.text}
              
            >
              {text}
            </Text>
          </View>
        }
      >
        <LinearGradient start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} colors={['#A22FEB', '#5B23E1']} style={{ flex: 1, height: '100%' }} />
      </MaskedView>
    </View>
  )
}


export default Header
