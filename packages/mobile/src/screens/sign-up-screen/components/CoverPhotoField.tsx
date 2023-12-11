import { useCallback } from 'react'

import type { Image } from '@audius/commands'
import { css } from '@emotion/native'
import { BlurView } from '@react-native-community/blur'
import { useField } from 'formik'
import type { ImageURISource } from 'react-native'
import { ImageBackground, Text, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { Box, IconImage, useTheme } from '@audius/harmony-native'
import { launchSelectImageActionSheet } from 'app/utils/launchSelectImageActionSheet'

const pickerOptions = { height: 500, width: 2000, freeStyleCropEnabled: true }

export const CoverPhotoField = () => {
  const [{ value: coverPhoto }, , { setValue }] =
    useField<ImageURISource>('coverPhoto')
  const [{ value: profileImage }] = useField<ImageURISource>('profileImage')
  const { color, cornerRadius, spacing } = useTheme()

  const handleSelectImage = useCallback(() => {
    const handleImageSelected = (image: Image) => {
      setValue(image)
    }
    launchSelectImageActionSheet(
      handleImageSelected,
      pickerOptions,
      'cover_photo'
    )
  }, [setValue])

  const borderRadiusStyle = css({
    borderTopLeftRadius: cornerRadius.m,
    borderTopRightRadius: cornerRadius.m,
    overflow: 'hidden'
  })

  return (
    <ImageBackground
      source={coverPhoto ?? profileImage}
      style={[
        { backgroundColor: color.neutral.n300, height: 96 },
        borderRadiusStyle
      ]}
      imageStyle={borderRadiusStyle}
    >
      {!profileImage && !coverPhoto ? (
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.20)', 'rgba(0, 0, 0, 0.00)']}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={{ height: '100%' }}
        />
      ) : null}
      {profileImage && !coverPhoto ? (
        <View style={borderRadiusStyle}>
          <BlurView
            blurType='light'
            blurAmount={20}
            style={[{ height: '100%' }]}
          />
        </View>
      ) : null}
      <IconImage
        style={{ position: 'absolute', top: spacing.m, right: spacing.m }}
        color='staticWhite'
        onPress={handleSelectImage}
      />
    </ImageBackground>
  )
}
