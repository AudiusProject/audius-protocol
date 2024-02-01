import { useEffect, useRef, useState } from 'react'

import type { Image as ImageType } from '@audius/common/store'
import {
  Animated,
  TouchableOpacity,
  View,
  Image,
  StyleSheet
} from 'react-native'

import NoPicture from 'app/assets/images/noPicture.png'

const styles = StyleSheet.create({
  profilePicEmpty: {
    flex: 0,
    width: 226,
    height: 226
  },
  profilePicShadow: {
    marginTop: 8,
    flex: 0,
    shadowColor: '#858199',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    width: 206,
    height: 206,
    marginBottom: 12
  },
  profilePic: {
    flex: 0,
    width: 206,
    height: 206,
    borderRadius: 113,
    borderWidth: 3,
    borderColor: '#FFFFFF'
  }
})

const ProfileImage = ({
  isPhotoLoading,
  setIsPhotoLoading,
  hasSelectedImage,
  photoBtnIsHidden,
  setPhotoBtnIsHidden,
  profileImage
}: {
  isPhotoLoading: boolean
  setIsPhotoLoading: (value: boolean) => void
  hasSelectedImage: boolean
  photoBtnIsHidden: boolean
  setPhotoBtnIsHidden: (value: boolean) => void
  profileImage: ImageType
}) => {
  const opacity = useRef(new Animated.Value(0)).current
  const [firstRender, setFirstRender] = useState(true)

  useEffect(() => {
    if (firstRender || isPhotoLoading) {
      setFirstRender(false)
      Animated.timing(opacity, {
        toValue: 0.2,
        duration: 100,
        useNativeDriver: true
      }).start(() => {
        setIsPhotoLoading(false)
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        }).start()
      })
    }
  }, [firstRender, opacity, isPhotoLoading, setIsPhotoLoading])

  return (
    <View>
      {hasSelectedImage ? (
        <Animated.View style={{ opacity }}>
          <TouchableOpacity
            style={styles.profilePicShadow}
            activeOpacity={1}
            onPress={() => {
              setPhotoBtnIsHidden(!photoBtnIsHidden)
            }}
          >
            <Image source={profileImage} style={styles.profilePic} />
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <Image source={NoPicture} style={styles.profilePicEmpty} />
      )}
    </View>
  )
}

export default ProfileImage
