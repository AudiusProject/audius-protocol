import { useCallback } from 'react'

import { modalsActions } from '@audius/common'
import { View } from 'react-native'

import IconUpload from 'app/assets/images/iconUpload.svg'
import { Button } from 'app/components/core'
import { MODAL_NAME } from 'app/components/mobile-upload-drawer'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'
const { setVisibility } = modalsActions

const messages = {
  uploadTrack: 'Upload Track'
}

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: {
    marginTop: spacing(4)
  },
  text: {
    color: palette.neutralLight2
  }
}))

export const UploadTrackButton = () => {
  const styles = useStyles()
  const dispatchWeb = useDispatchWeb()
  const { neutralLight2 } = useThemeColors()

  const handlePress = useCallback(() => {
    dispatchWeb(setVisibility({ modal: MODAL_NAME, visible: true }))
  }, [dispatchWeb])

  return (
    <View pointerEvents='box-none' style={styles.root}>
      <Button
        styles={{
          text: styles.text
        }}
        variant='commonAlt'
        title={messages.uploadTrack}
        icon={IconUpload}
        iconPosition='left'
        IconProps={{ fill: neutralLight2 }}
        fullWidth
        onPress={handlePress}
      />
    </View>
  )
}
