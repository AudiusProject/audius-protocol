import { useCallback, useMemo, useState } from 'react'

import { useField } from 'formik'
import { capitalize } from 'lodash'
import { View } from 'react-native'
import type { Asset } from 'react-native-image-picker'

import IconCamera from 'app/assets/images/iconCamera.svg'
import IconImage from 'app/assets/images/iconImage.svg'
import { Button, DynamicImage } from 'app/components/core'
import { InputErrorMessage } from 'app/components/core/InputErrorMessage'
import LoadingSpinner from 'app/components/loading-spinner'
import { makeStyles } from 'app/styles'
import type { Image } from 'app/types/image'
import { launchSelectImageActionSheet } from 'app/utils/launchSelectImageActionSheet'
import { useThemeColors } from 'app/utils/theme'

type Error = {
  url: string
}

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
  buttonIcon: {
    marginRight: spacing(2)
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

export const PickArtworkField = () => {
  const styles = useStyles()
  const { neutralLight8 } = useThemeColors()
  const name = 'artwork'
  const [{ value }, { error, touched }, { setValue }] = useField(name)
  const [{ value: existingTrackArtwork }] = useField('trackArtwork')
  const trackArtworkUrl = value?.url ?? existingTrackArtwork

  const { secondary } = useThemeColors()

  const [isLoading, setIsLoading] = useState(false)

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
    launchSelectImageActionSheet(handleImageSelected, secondary)
  }, [secondary, setValue])

  const source = useMemo(() => ({ uri: trackArtworkUrl }), [trackArtworkUrl])

  return (
    <View style={styles.root}>
      <DynamicImage
        source={source}
        onLoad={() => setIsLoading(false)}
        style={styles.image}
        noSkeleton
      >
        <View style={styles.iconPicture}>
          {isLoading ? (
            <LoadingSpinner style={styles.loading} />
          ) : trackArtworkUrl ? null : (
            <IconImage height={128} width={128} fill={neutralLight8} />
          )}
        </View>
        <View style={styles.button}>
          <Button
            variant='commonAlt'
            styles={{ root: { zIndex: 1000 }, icon: styles.buttonIcon }}
            title={
              trackArtworkUrl ? messages.changeArtwork : messages.addArtwork
            }
            icon={IconCamera}
            iconPosition='left'
            onPress={handlePress}
          />
        </View>
      </DynamicImage>
      {error && touched ? (
        <InputErrorMessage
          message={`${capitalize(name)} ${error as unknown as Error}`}
        />
      ) : null}
    </View>
  )
}
