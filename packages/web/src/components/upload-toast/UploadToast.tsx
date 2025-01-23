import { useEffect } from 'react'

import {
  accountSelectors,
  CommonState,
  UploadType,
  toastActions
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

const { UPLOAD_PAGE, profilePage, collectionPage } = route
const { getUserHandle } = accountSelectors
const { toast } = toastActions

const messages = {
  uploadComplete: 'Your upload is complete!',
  view: 'View'
}

export const UploadToast = () => {
  const dispatch = useDispatch()
  const location = useLocation()
  const upload = useSelector((state: CommonState) => state.upload)
  const accountHandle = useSelector(getUserHandle)

  useEffect(() => {
    if (upload.success && location.pathname !== UPLOAD_PAGE && accountHandle) {
      let link = ''

      if (!upload.tracks || upload.tracks.length > 1) {
        link = profilePage(accountHandle)
      } else if (upload.completedEntity) {
        link = collectionPage(
          null,
          null,
          null,
          upload.completedEntity.permalink,
          upload.uploadType === UploadType.ALBUM
        )
      } else {
        link = upload.tracks[0].metadata.permalink
      }

      dispatch(
        toast({
          content: messages.uploadComplete,
          link,
          linkText: messages.view
        })
      )
    }
  }, [upload.success, location.pathname, dispatch, accountHandle, upload])

  return null
}
