import { useEffect, useState } from 'react'

import { View } from 'react-native'

import IconUpload from 'app/assets/images/iconUpload.svg'
import { Screen, Text, Tile } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { useRoute } from 'app/hooks/useRoute'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { UploadingTrackTile } from './UploadingTrackTile'
import type { CompletedTrackMetadata } from './types'

const useStyles = makeStyles(({ spacing }) => ({
  root: { marginHorizontal: spacing(3) },
  tile: {
    marginTop: spacing(6),
    marginBottom: spacing(4)
  },
  tileContent: {
    alignItems: 'center',
    padding: spacing(4)
  },
  title: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing(4)
  },
  description: {
    textAlign: 'center'
  },
  tileIcon: {
    marginRight: spacing(2)
  }
}))

const messages = {
  uploading: 'Uploading',
  uploadTitle: 'Upload in Progress',
  uploadDescription:
    'Please make sure the screen stays on and keep the app open until the upload is complete.'
}

export type UploadingTracksParams = { tracks: CompletedTrackMetadata[] }

export const UploadingTracksScreen = () => {
  const { params } = useRoute<'UploadingTracks'>()
  const { tracks } = params
  const styles = useStyles()
  const { neutralLight4 } = useThemeColors()
  const [uploadProgress, setUploadProgress] = useState(0)
  const navigation = useNavigation()

  useEffect(() => {
    if (uploadProgress < 100) {
      const timeout = setTimeout(() => {
        setUploadProgress(uploadProgress + 20)
      }, 800)
      return () => clearTimeout(timeout)
    } else {
      navigation.navigate('UploadComplete', {
        tracks: tracks.map((track) => ({ ...track, permalink: 'tmp' }))
      })
    }
  }, [uploadProgress, navigation, tracks])

  return (
    <Screen title={messages.uploading} icon={IconUpload} style={styles.root}>
      <Tile styles={{ root: styles.tile, content: styles.tileContent }}>
        <View style={styles.title}>
          <IconUpload
            fill={neutralLight4}
            width={24}
            height={24}
            style={styles.tileIcon}
          />
          <Text fontSize='xxl' weight='bold' color='neutralLight4'>
            {messages.uploadTitle}
          </Text>
        </View>
        <Text variant='body' style={styles.description}>
          {messages.uploadDescription}
        </Text>
      </Tile>
      {tracks.map((track) => (
        <UploadingTrackTile
          key={track.name}
          track={track}
          uploadProgress={uploadProgress}
        />
      ))}
    </Screen>
  )
}
