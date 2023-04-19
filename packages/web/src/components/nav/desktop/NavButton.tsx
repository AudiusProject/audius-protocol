import { useCallback } from 'react'

import {
  Name,
  Status,
  accountSelectors,
  uploadActions,
  uploadSelectors
} from '@audius/common'
import {
  Button,
  ButtonType,
  ButtonSize,
  IconFollow,
  IconUpload
} from '@audius/stems'
import cn from 'classnames'
import { push } from 'connected-react-router'
import { useDispatch, useSelector } from 'react-redux'

import { make, useRecord } from 'common/store/analytics/actions'
import { openSignOn } from 'common/store/pages/signon/actions'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { AppState } from 'store/types'
import { UPLOAD_PAGE } from 'utils/route'

import styles from './NavButton.module.css'

const { getAccountStatus, getAccountUser } = accountSelectors
const { resetState: resetUploadState } = uploadActions
const { getIsUploading } = uploadSelectors

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
    dispatch(openSignOn(/** signIn */ false))
    record(make(Name.CREATE_ACCOUNT_OPEN, { source: 'nav button' }))
  }, [dispatch, record])

  const handleUpload = useCallback(() => {
    if (!isUploading) {
      dispatch(resetUploadState())
    }
    dispatch(push(UPLOAD_PAGE))
    record(make(Name.TRACK_UPLOAD_OPEN, { source: 'nav' }))
  }, [isUploading, dispatch, record])

  let button
  switch (status) {
    case 'signedOut':
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
      break
    case 'signedIn':
      button = (
        <Button
          className={cn(styles.navButton, styles.upload)}
          textClassName={styles.navButtonText}
          iconClassName={styles.navButtonIcon}
          type={ButtonType.COMMON}
          size={ButtonSize.SMALL}
          text='Upload Track'
          leftIcon={<IconUpload />}
          onClick={handleUpload}
        />
      )
      break
    case 'uploading':
      button = (
        <Button
          className={cn(styles.navButton, styles.upload)}
          textClassName={styles.navButtonText}
          iconClassName={styles.navButtonIcon}
          type={ButtonType.COMMON_ALT}
          size={ButtonSize.SMALL}
          text='Uploading...'
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
