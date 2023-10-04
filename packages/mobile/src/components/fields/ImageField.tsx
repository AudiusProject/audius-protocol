import { useCallback, useMemo, useState } from 'react'

import type { Nullable } from '@audius/common'
import { useField } from 'formik'
import type { ImageStyle, ViewStyle } from 'react-native'
import { Animated, Pressable, View } from 'react-native'
import type { Asset } from 'react-native-image-picker'

import IconUpload from 'app/assets/images/iconUpload.svg'
import { DynamicImage } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { usePressScaleAnimation } from 'app/hooks/usePressScaleAnimation'
import type { StylesProps } from 'app/styles'
import { makeStyles } from 'app/styles'
import type { Image } from 'app/types/image'
import { launchSelectImageActionSheet } from 'app/utils/launchSelectImageActionSheet'

const messages = {
  select: 'Select'
}

const useStyles = makeStyles(({ palette, spacing }) => ({
  root: {
    marginHorizontal: spacing(4)
  },
  imageContainer: {
    aspectRatio: 1,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden'
  },
  image: {
    height: '100%',
    borderRadius: 8
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
    opacity: 0.2
  },
  shareSheet: {
    color: palette.secondary
  }
}))

type ImageValue = Nullable<{ file: any; url: string }>

type ImageFieldProps = {
  isProcessing?: boolean
  name: string
  label?: string
} & StylesProps<{
  root?: ViewStyle
  imageContainer?: ViewStyle
  image?: ImageStyle
}>

export const ImageField = (props: ImageFieldProps) => {
  const { isProcessing, name, styles: stylesProp, style, label } = props
  const styles = useStyles()
  const [isLoading, setIsLoading] = useState(false)
  const [{ value }, , { setValue }] = useField<ImageValue>(name)

  const url = value?.url

  const { scale, handlePressIn, handlePressOut } = usePressScaleAnimation(0.9)

  const handlePress = useCallback(() => {
    const handleImageSelected = (_image: Image, rawResponse: Asset) => {
      setValue({
        url: rawResponse.uri!,
        file: {
          uri: rawResponse.uri,
          name: rawResponse.fileName,
          type: rawResponse.type
        }
      })
      setIsLoading(true)
    }
    launchSelectImageActionSheet(
      handleImageSelected,
      styles.shareSheet.color,
      name
    )
  }, [setValue, styles.shareSheet.color, name])

  const isDefaultImage = url && /imageCoverPhotoBlank/.test(url)

  const source = useMemo(
    () => ({ uri: isDefaultImage ? `https://audius.co/${url}` : url }),
    [isDefaultImage, url]
  )

  return (
    <Pressable
      accessibilityLabel={label ? `${messages.select} ${label}` : undefined}
      accessibilityRole='button'
      style={[styles.root, style, stylesProp?.root]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <DynamicImage
        source={source}
        styles={{
          root: [styles.imageContainer, stylesProp?.imageContainer],
          image: [styles.image, stylesProp?.image]
        }}
        onLoad={() => setIsLoading(false)}
        resizeMode={isDefaultImage ? 'repeat' : undefined}
        noSkeleton
      >
        <View style={styles.backdrop} />
        <Animated.View style={[styles.centerIcon, { transform: [{ scale }] }]}>
          {isLoading || isProcessing ? (
            <LoadingSpinner />
          ) : (
            <IconUpload fill={styles.centerIcon.fill} height={32} width={32} />
          )}
        </Animated.View>
      </DynamicImage>
    </Pressable>
  )
}
