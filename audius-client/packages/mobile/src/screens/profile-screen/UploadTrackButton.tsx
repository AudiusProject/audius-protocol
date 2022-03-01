import { useCallback } from 'react'

import { setVisibility } from 'audius-client/src/common/store/ui/modals/slice'

import IconUpload from 'app/assets/images/iconUpload.svg'
import { Button } from 'app/components/core'
import { MODAL_NAME } from 'app/components/mobile-upload-drawer'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'

const messages = {
  uploadTrack: 'Upload Track'
}

export const UploadTrackButton = () => {
  const dispatchWeb = useDispatchWeb()

  const handlePress = useCallback(() => {
    dispatchWeb(setVisibility({ modal: MODAL_NAME, visible: true }))
  }, [dispatchWeb])

  return (
    <Button
      variant='commonAlt'
      title={messages.uploadTrack}
      icon={IconUpload}
      iconPosition='left'
      fullWidth
      onPress={handlePress}
    />
  )
}
