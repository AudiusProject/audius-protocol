import { useCallback } from 'react'

import { Name, Status } from '@audius/common/models'
import {
  accountSelectors,
  uploadActions,
  uploadSelectors
} from '@audius/common/store'
import {
  Button,
  ButtonType,
  ButtonSize,
  IconFollow,
  IconUpload
} from '@audius/stems'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { make, useRecord } from 'common/store/analytics/actions'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { AppState } from 'store/types'
import { SIGN_UP_PAGE, UPLOAD_PAGE } from 'utils/route'

import styles from './NavButton.module.css'

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
    case 'signedOut':
      button = (
        <Button
          as={Link}
          to={SIGN_UP_PAGE}
          className={cn(styles.navButton, styles.createAccount)}
          textClassName={styles.navButtonText}
          iconClassName={styles.navButtonIcon}
          type={ButtonType.PRIMARY_ALT}
          size={ButtonSize.SMALL}
          text={messages.signUp}
          leftIcon={<IconFollow />}
          onClick={handleSignup}
        />
      )
      break
    case 'signedIn':
      button = (
        <Button
          as={Link}
          to={UPLOAD_PAGE}
          className={cn(styles.navButton, styles.upload)}
          textClassName={styles.navButtonText}
          iconClassName={styles.navButtonIcon}
          type={ButtonType.COMMON}
          size={ButtonSize.SMALL}
          text={messages.uploadTrack}
          leftIcon={<IconUpload />}
          onClick={handleUpload}
        />
      )
      break
    case 'uploading':
      button = (
        <Button
          as={Link}
          to={UPLOAD_PAGE}
          className={cn(styles.navButton, styles.upload)}
          textClassName={styles.navButtonText}
          iconClassName={styles.navButtonIcon}
          type={ButtonType.COMMON_ALT}
          size={ButtonSize.SMALL}
          text={messages.uploading}
          leftIcon={<LoadingSpinner className={styles.spinner} />}
          onClick={handleUpload}
        />
      )
      break
    case 'loading':
      button = null
      break
    default:
      button = (
        <Button
          className={cn(styles.navButton, styles.createAccount)}
          textClassName={styles.navButtonText}
          iconClassName={styles.navButtonIcon}
          type={ButtonType.PRIMARY_ALT}
          size={ButtonSize.SMALL}
          text='SIGN UP'
          leftIcon={<IconFollow />}
          onClick={handleSignup}
        />
      )
  }

  return button
}
