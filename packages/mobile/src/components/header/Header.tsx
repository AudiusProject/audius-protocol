import React from 'react'
import {
  StyleSheet,
  Text,
  View
} from 'react-native'
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';

const styles = StyleSheet.create({
  masked: {
    height: 52,
    width: '100%'
  },
  header: {
    height: '100%',
    paddingTop: 10,
    paddingLeft: 12,
    flex: 1,
    backgroundColor: 'transparent'
  },
  text: {
    fontWeight: "900",
    fontSize: 24,
  }
})

type HeaderProps = {
  text: string
}

const Header = ({
  text
}: HeaderProps) => {
  return (
    <>
      <MaskedView
        style={styles.masked}
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
        <LinearGradient start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} colors={['#5B23E1', '#A22FEB']} style={{ flex: 1, height: '100%' }} />
      </MaskedView>
    </>
  )
}


export default Header
