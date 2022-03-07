import { useCallback } from 'react'

import { setVisibility } from 'audius-client/src/common/store/ui/modals/slice'

import IconUpload from 'app/assets/images/iconUpload.svg'
import { Button } from 'app/components/core'
import { MODAL_NAME } from 'app/components/mobile-upload-drawer'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { makeStyles } from 'app/styles'

const messages = {
  uploadTrack: 'Upload Track'
}

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    marginTop: spacing(4)
  }
}))

export const UploadTrackButton = () => {
  const styles = useStyles()
  const dispatchWeb = useDispatchWeb()

  const handlePress = useCallback(() => {
    dispatchWeb(setVisibility({ modal: MODAL_NAME, visible: true }))
  }, [dispatchWeb])

  return (
    <Button
      style={styles.root}
      variant='commonAlt'
      title={messages.uploadTrack}
      icon={IconUpload}
      iconPosition='left'
      fullWidth
      onPress={handlePress}
    />
  )
}
