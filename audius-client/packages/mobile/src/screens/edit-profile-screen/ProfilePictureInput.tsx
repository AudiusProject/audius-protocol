import { useCallback, useState } from 'react'

import { useField } from 'formik'
import { Animated, Pressable, View } from 'react-native'

import IconUpload from 'app/assets/images/iconUpload.svg'
import { DynamicImage } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { usePressScaleAnimation } from 'app/hooks/usePressScaleAnimation'
import { makeStyles } from 'app/styles'

import { launchSelectImageActionSheet } from './launchSelectImageActionSheet'
import { ProfileValues, Image } from './types'

const useStyles = makeStyles(({ palette }) => ({
  profilePicture: {
    position: 'absolute',
    top: 37,
    left: 11,
    height: 100,
    width: 100,
    borderRadius: 100 / 2,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: palette.white,
    zIndex: 100,
    overflow: 'hidden'
  },
  profilePictureImage: {
    backgroundColor: palette.neutral
  },
  centerIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    fill: palette.staticWhite
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#000',
    opacity: 0.3
  },
  shareSheet: {
    color: palette.secondary
  }
}))

export const ProfilePictureInput = () => {
  const styles = useStyles()
  const [isLoading, setIsLoading] = useState(false)
  const [{ value }, , { setValue }] = useField<
    ProfileValues['profile_picture']
  >('profile_picture')

  const { scale, handlePressIn, handlePressOut } = usePressScaleAnimation(0.9)

  const handlePress = useCallback(() => {
    const handleImageSelected = (image: Image) => {
      setValue(image)
      setIsLoading(true)
    }
    launchSelectImageActionSheet(handleImageSelected, styles.shareSheet.color)
  }, [setValue])

  return (
    <Pressable
      style={styles.profilePicture}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <DynamicImage
        styles={{ image: styles.profilePictureImage }}
        source={{ uri: value.uri }}
        onLoad={() => setIsLoading(false)}
      >
        <View style={styles.backdrop} />
        <Animated.View style={[styles.centerIcon, { transform: [{ scale }] }]}>
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <IconUpload fill={styles.centerIcon.fill} height={32} width={32} />
          )}
        </Animated.View>
      </DynamicImage>
    </Pressable>
  )
}
