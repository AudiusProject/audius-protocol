import { useCallback, useEffect, useState } from 'react'

import { Status } from '@audius/common'
import { Button, ButtonType, IconLock } from '@audius/stems'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import {
  getChangePasswordStatus,
  getCurrentPage
} from 'common/store/change-password/selectors'
import {
  changePage,
  changePassword,
  Page
} from 'common/store/change-password/slice'
import LoadingSpinnerFullPage from 'components/loading-spinner-full-page/LoadingSpinnerFullPage'
import EnterPassword from 'components/sign-on/EnterPassword'

import styles from './ChangePassword.module.css'
import { ConfirmCredentials } from './ConfirmCredentials'

const messages = {
  helpTexts: [
    'Please enter your email and current password.',
    'Create A New Password That Is\n Secure And Easy To Remember!',
    'Changing Password, Please wait',
    'Your Password Has Been Changed',
    'Something went wrong. Please try again'
  ],
  changePassword: 'Change Password'
}

type ChangePasswordProps = {
  isMobile: boolean
  onComplete: () => void
}

export const ChangePassword = ({
  isMobile,
  onComplete
}: ChangePasswordProps) => {
  const [email, setEmail] = useState('')
  const [oldPassword, setOldPassword] = useState('')

  const dispatch = useDispatch()

  const changePasswordStatus = useSelector(getChangePasswordStatus)
  const currentPage = useSelector(getCurrentPage)

  const onCredentialsConfirmed = ({
    email,
    password
  }: {
    email: string
    password: string
  }) => {
    setEmail(email)
    setOldPassword(password)
    setCurrentPage(Page.NEW_PASSWORD)
  }

  const onNewPasswordSubmitted = (password: string) => {
    dispatch(changePassword({ email, password, oldPassword }))
  }

  const setCurrentPage = useCallback(
    (page: Page) => {
      dispatch(changePage(page))
    },
    [dispatch]
  )

  useEffect(() => {
    if (changePasswordStatus === Status.LOADING) {
      setCurrentPage(Page.LOADING)
    } else if (
      currentPage === Page.LOADING &&
      changePasswordStatus === Status.SUCCESS
    ) {
      setCurrentPage(Page.SUCCESS)
    } else if (
      currentPage === Page.LOADING &&
      changePasswordStatus === Status.ERROR
    ) {
      setCurrentPage(Page.FAILURE)
    }
  }, [changePasswordStatus, currentPage, setCurrentPage])

  const getPageContents = () => {
    switch (currentPage) {
      case Page.NEW_PASSWORD:
        return (
          <EnterPassword
            continueLabel={messages.changePassword}
            continueIcon={<IconLock />}
            isMobile={true}
            onSubmit={onNewPasswordSubmitted}
          />
        )
      case Page.LOADING:
        return <LoadingSpinnerFullPage />
      case Page.FAILURE:
      case Page.SUCCESS:
        return (
          <Button
            text='Done'
            onClick={onComplete}
            type={ButtonType.PRIMARY_ALT}
          />
        )
      default:
        return (
          <ConfirmCredentials
            isMobile={isMobile}
            onComplete={onCredentialsConfirmed}
          />
        )
    }
  }
  return (
    <div className={cn(styles.content, { [styles.isMobile]: isMobile })}>
      {currentPage === Page.CONFIRM_CREDENTIALS && isMobile ? (
        <>
          <div className={styles.headerText}>{messages.changePassword}</div>
          <div className={styles.helpText}>
            {messages.helpTexts[currentPage]}
          </div>
        </>
      ) : (
        <div
          className={cn(styles.headerText, {
            [styles.error]: currentPage === Page.FAILURE
          })}
        >
          {messages.helpTexts[currentPage]}
          {currentPage === Page.FAILURE && (
            <i className='emoji confused-face'></i>
          )}
        </div>
      )}
      {getPageContents()}
    </div>
  )
}
