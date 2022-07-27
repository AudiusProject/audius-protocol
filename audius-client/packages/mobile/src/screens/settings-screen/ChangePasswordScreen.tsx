import { useCallback, useEffect, useState } from 'react'

import { Status } from '@audius/common'
import {
  getChangePasswordStatus,
  getCurrentPage
} from 'audius-client/src/common/store/change-password/selectors'
import {
  changePage,
  changePassword,
  Page
} from 'audius-client/src/common/store/change-password/slice'
import { View } from 'react-native'

import { ConfirmCredentials } from 'app/components/confirm-credentials'
import { Button, Screen, Text } from 'app/components/core'
import { EnterPassword } from 'app/components/enter-password'
import LoadingSpinner from 'app/components/loading-spinner'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

import type { ProfileTabScreenParamList } from '../app-screen/ProfileTabScreen'

const messages = {
  changeHeader: 'Change Password',
  createNewHeader: 'Create A New Password That Is Secure And Easy To Remember!',
  doneHeader: 'Your Password Has Been Changed',
  changeText: 'Please enter your email and current password.',
  numberRequirement: 'Must contain numbers',
  lengthRequirement: 'Length must be at least 8 characters',
  hardRequirement: 'Hard to guess',
  matchRequirement: 'Passwords match'
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
  const dispatchWeb = useDispatchWeb()
  const styles = useStyles()
  const [email, setEmail] = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const navigation = useNavigation<ProfileTabScreenParamList>()

  const changePasswordStatus = useSelectorWeb(getChangePasswordStatus)
  const currentPage = useSelectorWeb(getCurrentPage)

  const setCurrentPage = useCallback(
    (page: Page) => dispatchWeb(changePage(page)),
    [dispatchWeb]
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
    setCurrentPage(Page.NEW_PASSWORD)
  }

  const handleNewPasswordSubmitted = (password: string) => {
    dispatchWeb(changePassword({ email, password, oldPassword }))
  }

  const handlePressDone = useCallback(() => {
    navigation.goBack()
    setCurrentPage(Page.CONFIRM_CREDENTIALS)
  }, [navigation, setCurrentPage])

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
      <EnterPassword onSubmit={handleNewPasswordSubmitted} />
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

  const getPageContent = () => {
    switch (currentPage) {
      case Page.NEW_PASSWORD:
        return changePasswordView
      case Page.LOADING:
        return loadingView
      case Page.SUCCESS:
      case Page.FAILURE:
        return doneView
      case Page.CONFIRM_CREDENTIALS:
      default:
        return credentialsView
    }
  }

  return (
    <Screen topbarRight={null} variant='secondary'>
      {getPageContent()}
    </Screen>
  )
}
