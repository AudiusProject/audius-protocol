import { useCallback, useMemo, useState } from 'react'

import { useField } from 'formik'
import { View } from 'react-native'
import type { Asset } from 'react-native-image-picker'

import IconImage from 'app/assets/images/iconImage.svg'
import IconPencil from 'app/assets/images/iconPencil.svg'
import { Button, DynamicImage } from 'app/components/core'
import { InputErrorMessage } from 'app/components/core/InputErrorMessage'
import LoadingSpinner from 'app/components/loading-spinner'
import { makeStyles } from 'app/styles'
import type { Image } from 'app/types/image'
import { launchSelectImageActionSheet } from 'app/utils/launchSelectImageActionSheet'
import { useThemeColors } from 'app/utils/theme'

const useStyles = makeStyles(({ palette, spacing }) => ({
  root: {
    marginTop: spacing(4),
    marginHorizontal: spacing(4),
    marginBottom: spacing(2)
  },
  image: {
    aspectRatio: 1,
    backgroundColor: palette.neutralLight6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.neutralLight9,
    overflow: 'hidden'
  },
  iconPicture: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center'
  },
  button: {
    position: 'absolute',
    bottom: spacing(6),
    left: 0,
    right: 0
  },
  loading: {
    height: 50,
    width: 50
  }
}))

const messages = {
  addArtwork: 'Add Artwork',
  changeArtwork: 'Change Artwork'
}

type PickArtworkFieldProps = {
  name: string
  onChange?: (image: Asset) => void
  buttonTitle?: string
  onPress?: () => void
  onImageLoad?: () => void
  isLoading?: boolean
}

export const PickArtworkField = (props: PickArtworkFieldProps) => {
  const { name, onChange, buttonTitle, onPress, onImageLoad, isLoading } = props
  const styles = useStyles()
  const { neutralLight8 } = useThemeColors()
  const [{ value }, { error, touched }, { setValue: setArtwork }] =
    useField(name)
  const [{ value: existingTrackArtwork }] = useField('trackArtwork')
  const trackArtworkUrl = value?.url ?? existingTrackArtwork
  const [isImageLoading, setIsImageLoading] = useState(false)

  const { secondary } = useThemeColors()

  const handleChangeArtwork = useCallback(() => {
    const handleImageSelected = (_image: Image, rawResponse: Asset) => {
      setArtwork({
        url: rawResponse.uri,
        file: {
          uri: rawResponse.uri,
          name: rawResponse.fileName,
          type: rawResponse.type
        },
        source: 'original'
      })
      onChange?.(rawResponse)
      setIsImageLoading(true)
    }
    launchSelectImageActionSheet(handleImageSelected, secondary)
  }, [secondary, setArtwork, onChange])

  const handleImageLoad = useCallback(() => {
    onImageLoad?.()
    setIsImageLoading(false)
  }, [onImageLoad])

  const source = useMemo(() => ({ uri: trackArtworkUrl }), [trackArtworkUrl])

  return (
    <View style={styles.root}>
      <DynamicImage
        source={source}
        onLoad={handleImageLoad}
        style={styles.image}
        noSkeleton
      >
        <View style={styles.iconPicture}>
          {isLoading || isImageLoading ? (
            <LoadingSpinner style={styles.loading} />
          ) : trackArtworkUrl ? null : (
            <IconImage height={128} width={128} fill={neutralLight8} />
          )}
        </View>
        <View style={styles.button}>
          <Button
            variant='secondaryAlt'
            size='large'
            title={
              buttonTitle ||
              (trackArtworkUrl ? messages.changeArtwork : messages.addArtwork)
            }
            icon={IconPencil}
            iconPosition='left'
            onPress={onPress ?? handleChangeArtwork}
          />
        </View>
      </DynamicImage>
      {error && touched ? <InputErrorMessage message={error} /> : null}
    </View>
  )
}
