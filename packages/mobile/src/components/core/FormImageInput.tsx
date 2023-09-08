import { useCallback, useMemo, useState } from 'react'

import { FeatureFlags } from '@audius/common'
import { useField } from 'formik'
import type { ImageStyle, ViewStyle } from 'react-native'
import { Animated, Pressable, View } from 'react-native'
import type { Asset } from 'react-native-image-picker'

import IconUpload from 'app/assets/images/iconUpload.svg'
import { DynamicImage } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { usePressScaleAnimation } from 'app/hooks/usePressScaleAnimation'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import type { StylesProps } from 'app/styles'
import { makeStyles } from 'app/styles'
import type { Image } from 'app/types/image'
import { launchSelectImageActionSheet } from 'app/utils/launchSelectImageActionSheet'

const useStyles = makeStyles(({ palette, spacing }) => ({
  root: {
    marginHorizontal: spacing(4)
  },
  legacyImageContainer: {
    height: 216,
    width: 216,
    borderRadius: 4,
    overflow: 'hidden'
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
  const { isEnabled: isPlaylistUpdatesEnabled } = useFeatureFlag(
    FeatureFlags.PLAYLIST_UPDATES_POST_QA
  )

  const { url } = value

  const { scale, handlePressIn, handlePressOut } = usePressScaleAnimation(0.9)

  const handlePress = useCallback(() => {
    const handleImageSelected = (_image: Image, rawResponse: Asset) => {
      setValue({
        url: rawResponse.uri,
        file: {
          uri: rawResponse.uri,
          name: rawResponse.fileName,
          type: rawResponse.type
        },
        source: 'original'
      })
      setIsLoading(true)
    }
    launchSelectImageActionSheet(handleImageSelected, styles.shareSheet.color)
  }, [setValue, styles.shareSheet.color])

  const isDefaultImage = /imageCoverPhotoBlank/.test(url)

  const source = useMemo(
    () => ({ uri: isDefaultImage ? `https://audius.co/${url}` : url }),
    [isDefaultImage, url]
  )

  return (
    <Pressable
      style={[styles.root, style, stylesProp?.root]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <DynamicImage
        source={source}
        styles={{
          root: [
            isPlaylistUpdatesEnabled
              ? styles.imageContainer
              : styles.legacyImageContainer,
            stylesProp?.imageContainer
          ],
          image: [styles.image, stylesProp?.image]
        }}
        onLoad={() => setIsLoading(false)}
        resizeMode={isDefaultImage ? 'repeat' : undefined}
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
