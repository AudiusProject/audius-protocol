import { useEffect } from 'react'

import { useUploadCompletionRoute } from '@audius/common/hooks'
import {
  accountSelectors,
  CommonState,
  uploadSelectors,
  UploadType
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import { IconCloudUpload, IconArrowRight } from '@audius/harmony'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { toast } from '~/store/ui/toast/slice'

import { matchesRoute } from 'utils/route'

const { UPLOAD_PAGE } = route

const { getUserHandle } = accountSelectors
const { getIsUploading, getUploadSuccess } = uploadSelectors

/**
 * Returns the upload status for the nav bar
 * @returns {isUploading: boolean, isOnUploadPage: boolean}
 * isUploading: Whether the user is currently uploading a file
 * isOnUploadPage: Whether the user is on the upload page
 */
export const useNavUploadStatus = () => {
  const isUploading = useSelector(getIsUploading)
  const uploadSuccess = useSelector(getUploadSuccess)
  const location = useLocation()
  const dispatch = useDispatch()
  const isOnUploadPage = matchesRoute({
    current: location.pathname,
    target: UPLOAD_PAGE
  })
  const accountHandle = useSelector(getUserHandle)
  const upload = useSelector((state: CommonState) => state.upload)
  const uploadType = upload.formState?.uploadType ?? UploadType.INDIVIDUAL_TRACK
  const uploadCompletionRoute = useUploadCompletionRoute({
    upload,
    accountHandle,
    uploadType
  })

  useEffect(() => {
    // if (uploadSuccess && !isOnUploadPage) {
    dispatch(
      toast({
        content: 'Your upload is complete!',
        link: uploadCompletionRoute ?? UPLOAD_PAGE,
        linkText: 'View',
        leftIcon: IconCloudUpload,
        rightIcon: IconArrowRight
      })
    )
    // }
  }, [uploadSuccess, isOnUploadPage, dispatch, uploadCompletionRoute])
  return { isUploading, isOnUploadPage }
}
