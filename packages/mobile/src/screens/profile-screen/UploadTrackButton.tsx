import { useCallback } from 'react'

import { FeatureFlags, modalsActions } from '@audius/common'
import { View } from 'react-native'
import { useDispatch } from 'react-redux'

import IconUpload from 'app/assets/images/iconUpload.svg'
import { Button } from 'app/components/core'
import { MODAL_NAME } from 'app/components/mobile-upload-drawer'
import { useNavigation } from 'app/hooks/useNavigation'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { makeStyles } from 'app/styles'
const { setVisibility } = modalsActions

const messages = {
  uploadTrack: 'Upload a Track'
}

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    marginTop: spacing(4)
  }
}))

export const UploadTrackButton = () => {
  const styles = useStyles()
  const dispatch = useDispatch()
  const navigation = useNavigation()
  const { isEnabled: isMobileUploadEnabled } = useFeatureFlag(
    FeatureFlags.MOBILE_UPLOAD
  )

  const handlePress = useCallback(() => {
    if (isMobileUploadEnabled) {
      navigation.push('Upload')
    } else {
      dispatch(setVisibility({ modal: MODAL_NAME, visible: true }))
    }
  }, [isMobileUploadEnabled, navigation, dispatch])

  return (
    <View pointerEvents='box-none' style={styles.root}>
      <Button
        variant='common'
        title={messages.uploadTrack}
        icon={IconUpload}
        iconPosition='left'
        fullWidth
        onPress={handlePress}
      />
    </View>
  )
}
