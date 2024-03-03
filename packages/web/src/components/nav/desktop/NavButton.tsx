import { useCallback } from 'react'

import { Name, Status } from '@audius/common/models'
import {
  accountSelectors,
  uploadActions,
  uploadSelectors
} from '@audius/common/store'
import {
  IconCloudUpload as IconUpload,
  IconUserFollow as IconFollow,
  Button
} from '@audius/harmony'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { make, useRecord } from 'common/store/analytics/actions'
import { AppState } from 'store/types'
import { SIGN_UP_PAGE, UPLOAD_PAGE } from 'utils/route'

const { getAccountStatus, getAccountUser } = accountSelectors
const { resetState: resetUploadState } = uploadActions
const { getIsUploading } = uploadSelectors

const messages = {
  signUp: 'Sign up',
  uploadTrack: 'Upload Track',
  uploading: 'Uploading...'
}

export const NavButton = () => {
  const dispatch = useDispatch()
  const record = useRecord()
  const isSignedIn = useSelector((state: AppState) => !!getAccountUser(state))
  const accountStatus = useSelector(getAccountStatus)
  const isUploading = useSelector(getIsUploading)

  let status = 'signedOut'
  if (isSignedIn) status = 'signedIn'
  if (isUploading) status = 'uploading'
  if (accountStatus === Status.LOADING) status = 'loading'

  const handleSignup = useCallback(() => {
    record(make(Name.CREATE_ACCOUNT_OPEN, { source: 'nav button' }))
  }, [record])

  const handleUpload = useCallback(() => {
    if (!isUploading) {
      dispatch(resetUploadState())
      record(make(Name.TRACK_UPLOAD_OPEN, { source: 'nav' }))
    }
  }, [isUploading, dispatch, record])

  let button
  switch (status) {
    case 'signedIn':
    case 'uploading':
      button = (
        <Button
          variant='secondary'
          size='small'
          asChild
          iconLeft={IconUpload}
          isLoading={status === 'uploading'}
          onClick={handleUpload}
        >
          <Link to={UPLOAD_PAGE}>{messages.uploadTrack}</Link>
        </Button>
      )
      break
    case 'loading':
      button = null
      break
    case 'signedOut':
    default:
      button = (
        <Button
          variant='primary'
          size='small'
          asChild
          iconLeft={IconFollow}
          onClick={handleSignup}
        >
          <Link to={SIGN_UP_PAGE}>{messages.signUp}</Link>
        </Button>
      )
      break
  }

  return button
}
