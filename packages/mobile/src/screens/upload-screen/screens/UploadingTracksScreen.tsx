import { useEffect } from 'react'

import type { UploadTrack } from '@audius/common'
import { uploadSelectors, UploadType, uploadActions } from '@audius/common'
import { useRoute } from '@react-navigation/native'
import { useKeepAwake } from '@sayem314/react-native-keep-awake'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { useEffectOnce } from 'react-use'

import IconUpload from 'app/assets/images/iconUpload.svg'
import { Screen, ScreenContent, Text, Tile } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { UploadingTrackTile } from '../components'
import type { UploadRouteProp } from '../types'
const { uploadTracks } = uploadActions
const { getUploadSuccess, getCombinedUploadPercentage } = uploadSelectors

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

export type UploadingTracksParams = { tracks: UploadTrack[] }

export const UploadingTracksScreen = () => {
  useKeepAwake()
  const { params } = useRoute<UploadRouteProp<'UploadingTracks'>>()
  const { tracks } = params
  const styles = useStyles()
  const { neutralLight4 } = useThemeColors()
  const navigation = useNavigation()
  const dispatch = useDispatch()

  useEffectOnce(() => {
    dispatch(uploadTracks(tracks, undefined, UploadType.INDIVIDUAL_TRACK))
  })

  const trackUploadProgress = useSelector(getCombinedUploadPercentage)
  const uploadSuccess = useSelector(getUploadSuccess)

  useEffect(() => {
    if (!uploadSuccess) {
      navigation.setOptions({ gestureEnabled: false })
    }
    if (uploadSuccess) {
      navigation.setOptions({ gestureEnabled: true })
      navigation.navigate('UploadComplete')
    }
  }, [uploadSuccess, navigation])

  return (
    <Screen
      title={messages.uploading}
      icon={IconUpload}
      style={styles.root}
      topbarLeft={null}
      url='/uploading-track'
    >
      <ScreenContent>
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
            key={track.metadata.title}
            track={track}
            uploadProgress={trackUploadProgress}
          />
        ))}
      </ScreenContent>
    </Screen>
  )
}
