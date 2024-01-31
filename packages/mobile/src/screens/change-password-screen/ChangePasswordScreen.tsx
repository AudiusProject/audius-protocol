import {
  changePasswordSelectors,
  changePasswordActions,
  ChangePasswordPageStep
} from '@audius/common/store'
import { useCallback, useEffect, useState } from 'react'

import { Status } from '@audius/common/models'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { Button, Screen, ScreenContent, Text } from 'app/components/core'
import { EnterPassword } from 'app/components/enter-password'
import LoadingSpinner from 'app/components/loading-spinner'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'

import type { ProfileTabScreenParamList } from '../app-screen/ProfileTabScreen'

import { ConfirmCredentials } from './ConfirmCredentials'
const { changePage, changePassword } = changePasswordActions
const { getChangePasswordStatus, getCurrentPage } = changePasswordSelectors

const messages = {
  changeHeader: 'Change Password',
  createNewHeader: 'Create A New Password That Is Secure And Easy To Remember!',
  doneHeader: 'Your Password Has Been Changed',
  changeText: 'Please enter your email and current password.',
  submitPasswordButton: 'Continue'
}

const useStyles = makeStyles(({ palette, spacing }) => ({
  contentContainer: {
    alignItems: 'center',
    paddingTop: spacing(32),
    paddingBottom: spacing(8),
    paddingHorizontal: spacing(6),
    width: 300,
    alignSelf: 'center'
  },
  header: {
    color: palette.secondary,
    marginBottom: spacing(4)
  },
  text: {
    textAlign: 'center'
  },
  input: {
    marginTop: spacing(3),
    paddingVertical: spacing(3)
  },
  button: {
    marginTop: spacing(4),
    width: '100%'
  }
}))

export const ChangePasswordScreen = () => {
  const dispatch = useDispatch()
  const styles = useStyles()
  const [email, setEmail] = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const navigation = useNavigation<ProfileTabScreenParamList>()

  const changePasswordStatus = useSelector(getChangePasswordStatus)
  const currentPage = useSelector(getCurrentPage)

  const setCurrentPage = useCallback(
    (page: ChangePasswordPageStep) => dispatch(changePage(page)),
    [dispatch]
  )

  const handleCredentialsConfirmed = ({
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

  const handleNewPasswordSubmitted = (password: string) => {
    dispatch(changePassword({ email, password, oldPassword }))
  }

  const handlePressDone = useCallback(() => {
    navigation.goBack()
    setCurrentPage(ChangePasswordPageStep.CONFIRM_CREDENTIALS)
  }, [navigation, setCurrentPage])

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
  }, [currentPage, setCurrentPage, changePasswordStatus])

  const credentialsView = (
    <View style={styles.contentContainer}>
      <Text style={styles.header} variant='h1'>
        {messages.changeHeader}
      </Text>
      <Text style={styles.text}>{messages.changeText}</Text>
      <ConfirmCredentials onComplete={handleCredentialsConfirmed} />
    </View>
  )

  const loadingView = (
    <LoadingSpinner style={{ alignSelf: 'center', marginVertical: 16 }} />
  )

  const changePasswordView = (
    <View style={[styles.contentContainer, { width: 350 }]}>
      <Text style={styles.header} variant='h1'>
        {messages.createNewHeader}
      </Text>
      <EnterPassword
        onSubmit={handleNewPasswordSubmitted}
        submitButtonText={messages.submitPasswordButton}
      />
    </View>
  )

  const doneView = (
    <View style={[styles.contentContainer, { width: 350 }]}>
      <Text style={styles.header} variant='h1'>
        {messages.doneHeader}
      </Text>
      <Button title='Done' size='large' onPress={handlePressDone} />
    </View>
  )

  const renderContent = () => {
    switch (currentPage) {
      case ChangePasswordPageStep.NEW_PASSWORD:
        return changePasswordView
      case ChangePasswordPageStep.LOADING:
        return loadingView
      case ChangePasswordPageStep.SUCCESS:
      case ChangePasswordPageStep.FAILURE:
        return doneView
      case ChangePasswordPageStep.CONFIRM_CREDENTIALS:
      default:
        return credentialsView
    }
  }

  return (
    <Screen topbarRight={null} variant='secondary'>
      <ScreenContent>{renderContent()}</ScreenContent>
    </Screen>
  )
}
