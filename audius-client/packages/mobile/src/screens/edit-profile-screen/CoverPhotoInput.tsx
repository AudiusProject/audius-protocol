import { useCallback, useState } from 'react'

import { useField } from 'formik'
import { Animated, Pressable, View } from 'react-native'

import IconUpload from 'app/assets/images/iconUpload.svg'
import { DynamicImage } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { usePressScaleAnimation } from 'app/hooks/usePressScaleAnimation'
import { makeStyles } from 'app/styles'

import { launchSelectImageActionSheet } from './launchSelectImageActionSheet'
import { Image, ProfileValues } from './types'

const useStyles = makeStyles(({ palette }) => ({
  root: {
    height: 96,
    overflow: 'hidden'
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

export const CoverPhotoInput = () => {
  const styles = useStyles()
  const [isLoading, setIsLoading] = useState(false)
  const [{ value }, , { setValue }] = useField<ProfileValues['cover_photo']>(
    'cover_photo'
  )

  const { scale, handlePressIn, handlePressOut } = usePressScaleAnimation(0.9)

  const handlePress = useCallback(() => {
    const handleImageSelected = (image: Image) => {
      setValue(image)
      setIsLoading(true)
    }
    launchSelectImageActionSheet(handleImageSelected, styles.shareSheet.color)
  }, [setValue, styles.shareSheet.color])

  return (
    <Pressable
      onPress={handlePress}
      style={styles.root}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <DynamicImage
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
