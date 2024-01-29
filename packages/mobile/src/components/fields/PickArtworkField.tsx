import { useCallback, useMemo, useState } from 'react'

import { useField } from 'formik'
import { View } from 'react-native'

import { IconImage, IconPencil } from '@audius/harmony-native'
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
  onChange?: () => void
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

  const handleChangeArtwork = useCallback(() => {
    const handleImageSelected = (image: Image) => {
      setArtwork(image)
      onChange?.()
      setIsImageLoading(true)
    }
    launchSelectImageActionSheet(handleImageSelected, {
      height: 1000,
      width: 1000
    })
  }, [setArtwork, onChange])

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
