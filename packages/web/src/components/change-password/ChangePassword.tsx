import { useCallback, useEffect, useState } from 'react'

import { Status } from '@audius/common/models'
import {
  changePasswordSelectors,
  changePasswordActions,
  ChangePasswordPageStep
} from '@audius/common/store'
import { Button, ButtonType } from '@audius/stems'
import { IconLock } from '@audius/harmony'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import LoadingSpinnerFullPage from 'components/loading-spinner-full-page/LoadingSpinnerFullPage'
import EnterPassword from 'components/sign-on/EnterPassword'

import styles from './ChangePassword.module.css'
import { ConfirmCredentials } from './ConfirmCredentials'
const { changePage, changePassword } = changePasswordActions
const { getChangePasswordStatus, getCurrentPage } = changePasswordSelectors

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
    setCurrentPage(ChangePasswordPageStep.NEW_PASSWORD)
  }

  const onNewPasswordSubmitted = (password: string) => {
    dispatch(changePassword({ email, password, oldPassword }))
  }

  const setCurrentPage = useCallback(
    (page: ChangePasswordPageStep) => {
      dispatch(changePage(page))
    },
    [dispatch]
  )

  useEffect(() => {
    if (changePasswordStatus === Status.LOADING) {
      setCurrentPage(ChangePasswordPageStep.LOADING)
    } else if (
      currentPage === ChangePasswordPageStep.LOADING &&
      changePasswordStatus === Status.SUCCESS
    ) {
      setCurrentPage(ChangePasswordPageStep.SUCCESS)
    } else if (
      currentPage === ChangePasswordPageStep.LOADING &&
      changePasswordStatus === Status.ERROR
    ) {
      setCurrentPage(ChangePasswordPageStep.FAILURE)
    }
  }, [changePasswordStatus, currentPage, setCurrentPage])

  const getPageContents = () => {
    switch (currentPage) {
      case ChangePasswordPageStep.NEW_PASSWORD:
        return (
          <EnterPassword
            continueLabel={messages.changePassword}
            continueIcon={IconLock}
            onSubmit={onNewPasswordSubmitted}
          />
        )
      case ChangePasswordPageStep.LOADING:
        return <LoadingSpinnerFullPage />
      case ChangePasswordPageStep.FAILURE:
      case ChangePasswordPageStep.SUCCESS:
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
      {currentPage === ChangePasswordPageStep.CONFIRM_CREDENTIALS &&
      isMobile ? (
        <>
          <div className={styles.headerText}>{messages.changePassword}</div>
          <div className={styles.helpText}>
            {messages.helpTexts[currentPage]}
          </div>
        </>
      ) : (
        <div
          className={cn(styles.headerText, {
            [styles.error]: currentPage === ChangePasswordPageStep.FAILURE
          })}
        >
          {messages.helpTexts[currentPage]}
          {currentPage === ChangePasswordPageStep.FAILURE && (
            <i className='emoji confused-face'></i>
          )}
        </div>
      )}
      {getPageContents()}
    </div>
  )
}
