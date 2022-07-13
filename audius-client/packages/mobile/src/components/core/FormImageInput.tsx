import { useCallback, useState } from 'react'

import { useField } from 'formik'
import { Animated, ImageStyle, Pressable, View, ViewStyle } from 'react-native'

import IconUpload from 'app/assets/images/iconUpload.svg'
import { DynamicImage } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { usePressScaleAnimation } from 'app/hooks/usePressScaleAnimation'
import { makeStyles, StylesProps } from 'app/styles'
import { Image } from 'app/types/image'
import { launchSelectImageActionSheet } from 'app/utils/launchSelectImageActionSheet'

const useStyles = makeStyles(({ palette }) => ({
  imageContainer: {
    height: 216,
    width: 216,
    borderRadius: 4,
    overflow: 'hidden'
  },
  image: {
    height: '100%'
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

type FormImageInputProps = {
  isProcessing?: boolean
  name: string
} & StylesProps<{
  root?: ViewStyle
  imageContainer?: ViewStyle
  image?: ImageStyle
}>

export const FormImageInput = ({
  isProcessing,
  name,
  styles: stylesProp,
  style
}: FormImageInputProps) => {
  const styles = useStyles()
  const [isLoading, setIsLoading] = useState(false)
  const [{ value }, , { setValue }] = useField(name)

  const { url } = value

  const { scale, handlePressIn, handlePressOut } = usePressScaleAnimation(0.9)

  const handlePress = useCallback(() => {
    const handleImageSelected = (image: Image) => {
      setValue(image)
      setIsLoading(true)
    }
    launchSelectImageActionSheet(handleImageSelected, styles.shareSheet.color)
  }, [setValue, styles.shareSheet.color])

  const isDefaultImage = /imageCoverPhotoBlank/.test(url)

  return (
    <Pressable
      style={[style, stylesProp?.root]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}>
      <DynamicImage
        uri={isDefaultImage ? `https://audius.co/${url}` : url}
        styles={{
          root: [styles.imageContainer, stylesProp?.imageContainer],
          image: [styles.image, stylesProp?.image]
        }}
        onLoad={() => setIsLoading(false)}
        resizeMode={isDefaultImage ? 'repeat' : undefined}>
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
