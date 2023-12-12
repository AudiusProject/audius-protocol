import { useCallback } from 'react'

import type { Image } from '@audius/common'
import { css } from '@emotion/native'
import { useField } from 'formik'
import { type ImageURISource } from 'react-native'

import { Avatar, IconCamera, useTheme } from '@audius/harmony-native'
import { launchSelectImageActionSheet } from 'app/utils/launchSelectImageActionSheet'

const pickerOptions = {
  height: 1000,
  width: 1000,
  cropperCircleOverlay: true
}

const messages = {
  label: 'Profile Picture'
}

export const ProfilePictureField = () => {
  const { spacing } = useTheme()
  const [{ value: profileImage }, , { setValue }] =
    useField<ImageURISource>('profileImage')

  const handleSelectImage = useCallback(() => {
    const handleImageSelected = (image: Image) => {
      setValue(image)
    }
    launchSelectImageActionSheet(
      handleImageSelected,
      pickerOptions,
      'profilePicture'
    )
  }, [setValue])

  return (
    <Avatar
      accessibilityLabel={messages.label}
      size='xl'
      variant='strong'
      style={css({
        position: 'absolute',
        left: spacing.unit4,
        top: spacing.unit10
      })}
      source={profileImage}
    >
      <IconCamera size='2xl' color='staticWhite' onPress={handleSelectImage} />
    </Avatar>
  )
}
