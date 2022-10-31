import { useEffect } from 'react'

import DocumentPicker from 'react-native-document-picker'
import { useAsyncFn } from 'react-use'

import IconUpload from 'app/assets/images/iconUpload.svg'
import { Button, Screen, Text, Tile } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

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
  }
}))

export const UploadScreen = () => {
  const styles = useStyles()
  const { neutralLight4 } = useThemeColors()
  const navigation = useNavigation()

  const [{ value }, handlePickTrack] = useAsyncFn(async () => {
    return DocumentPicker.pick({ type: DocumentPicker.types.audio })
  }, [])

  useEffect(() => {
    if (value) {
      navigation.push('CompleteTrack', value[0])
    }
  }, [value, navigation])

  return (
    <Screen title={messages.title} icon={IconUpload} variant='secondary'>
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
          onPress={handlePickTrack}
        />
      </Tile>
    </Screen>
  )
}
