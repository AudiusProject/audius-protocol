import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  TouchableOpacity,
  View,
  Image,
  StyleSheet
} from 'react-native'
import NoPicture from '../../assets/images/noPicture.png'

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
  imageSet,
  photoBtnIsHidden,
  setPhotoBtnIsHidden,
  profileImage
}: {
  isPhotoLoading: boolean
  setIsPhotoLoading: (value: boolean) => void
  imageSet: boolean
  photoBtnIsHidden: boolean
  setPhotoBtnIsHidden: (value: boolean) => void
  profileImage: {
    uri: string
    height?: number
    width?: number
    name?: string
    size?: number
    fileType?: string
    file?: string
  }
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
      {imageSet ? (
        <Animated.View style={{ opacity }}>
          <TouchableOpacity
            style={styles.profilePicShadow}
            activeOpacity={1}
            onPress={() => {
              setPhotoBtnIsHidden(!photoBtnIsHidden)
            }}
          >
            <Image
              source={profileImage}
              height={206}
              width={206}
              style={[styles.profilePic]}
            />
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <Image
          height={226}
          width={226}
          source={NoPicture}
          style={styles.profilePicEmpty}
        />
      )}
    </View>
  )
}

export default ProfileImage
