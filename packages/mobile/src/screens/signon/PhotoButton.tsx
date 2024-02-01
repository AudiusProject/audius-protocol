import { StyleSheet, View, TouchableOpacity, Text } from 'react-native'

import { IconCamera } from '@audius/harmony-native'

const styles = StyleSheet.create({
  cameraBtn: {
    position: 'absolute',
    backgroundColor: '#FCFCFC',
    width: 114,
    height: 40,
    borderRadius: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    zIndex: 5,
    elevation: 5,
    alignSelf: 'center',
    marginTop: 137,
    textAlign: 'center'
  },
  cameraBtnTitleContainer: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'center'
  },
  cameraBtnTitle: {
    color: '#7E1BCC',
    fontSize: 16,
    fontFamily: 'AvenirNextLTPro-Bold',
    marginLeft: 11
  }
})

const messages = {
  photoBtnAdd: 'Add',
  photoBtnChange: 'Change'
}

const PhotoButton = ({
  hasSelectedImage,
  photoBtnIsHidden,
  doAction
}: {
  hasSelectedImage: boolean
  photoBtnIsHidden: boolean
  doAction: () => void
}) => {
  return !photoBtnIsHidden ? (
    <TouchableOpacity
      style={[styles.cameraBtn]}
      activeOpacity={0.6}
      onPress={() => {
        doAction()
      }}
    >
      <View style={styles.cameraBtnTitleContainer}>
        <IconCamera height={18} width={22} fill={'#7E1BCC'} />
        <Text style={styles.cameraBtnTitle}>
          {!hasSelectedImage ? messages.photoBtnAdd : messages.photoBtnChange}
        </Text>
      </View>
    </TouchableOpacity>
  ) : null
}

export default PhotoButton
