import { useCallback, useEffect, useState } from 'react'

import { useFocusEffect } from '@react-navigation/native'
import DocumentPicker from 'react-native-document-picker'
import { useAsyncFn } from 'react-use'

import IconRemove from 'app/assets/images/iconRemove.svg'
import IconUpload from 'app/assets/images/iconUpload.svg'
import { Button, ErrorText, Screen, Text, Tile } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

import { TopBarIconButton } from '../app-screen'

import type { UploadParamList } from './ParamList'
import { processTrackFile } from './utils/processTrackFile'

const messages = {
  screenTitle: 'Upload',
  title: 'Upload Tracks',
  description: 'Select Audio Files to Upload',
  browse: 'Browse Files'
}

const useStyles = makeStyles(({ spacing }) => ({
  tile: {
    margin: spacing(3)
  },
  tileContent: {
    padding: spacing(4),
    alignItems: 'center'
  },
  title: {
    marginBottom: spacing(4)
  },
  description: {
    marginBottom: spacing(4)
  },
  errorText: {
    marginTop: spacing(4)
  }
}))

export const SelectTrackScreen = () => {
  const styles = useStyles()
  const { neutralLight4 } = useThemeColors()
  const navigation = useNavigation<UploadParamList>()
  const [navigatedBack, setNavigatedBack] = useState(false)

  const [{ value: track, loading, error }, handlePickTrack] =
    useAsyncFn(async () => {
      try {
        const trackFile = await DocumentPicker.pickSingle({
          type: DocumentPicker.types.audio
        })
        return processTrackFile(trackFile)
      } catch (error) {
        DocumentPicker.isCancel(error)
        return null
      }
    }, [])

  useEffect(() => {
    if (track) {
      navigation.push('CompleteTrack', track)
    }
  }, [track, navigation])

  useFocusEffect(
    useCallback(() => {
      if (track) {
        setNavigatedBack(true)
      }
    }, [track])
  )

  useEffect(() => {
    if (loading) {
      setNavigatedBack(false)
    }
  }, [loading])

  const handleBack = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const isLoading = loading || (track && !navigatedBack)

  return (
    <Screen
      title={messages.title}
      icon={IconUpload}
      variant='secondary'
      topbarLeft={<TopBarIconButton icon={IconRemove} onPress={handleBack} />}
    >
      <Tile styles={{ root: styles.tile, content: styles.tileContent }}>
        <IconUpload
          fill={neutralLight4}
          height={spacing(20)}
          width={spacing(20)}
        />
        <Text fontSize='xxl' weight='bold' style={styles.title}>
          {messages.title}
        </Text>
        <Text variant='h4' style={styles.description}>
          {messages.description}
        </Text>
        <Button
          title={messages.browse}
          fullWidth
          variant='primary'
          size='large'
          icon={isLoading ? LoadingSpinner : undefined}
          disabled={isLoading}
          onPress={handlePickTrack}
        />
        {error && !loading ? (
          <ErrorText style={styles.errorText}>{error.message}</ErrorText>
        ) : null}
      </Tile>
    </Screen>
  )
}
