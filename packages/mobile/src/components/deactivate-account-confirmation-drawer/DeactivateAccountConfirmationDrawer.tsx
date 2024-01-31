import { useCallback, useEffect } from 'react'

import { Status } from '@audius/common/models'
import {
  deactivateAccountActions,
  deactivateAccountSelectors
} from '@audius/common/store'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import LoadingSpinner from 'app/components/loading-spinner'
import { makeStyles } from 'app/styles'

import { Button, Text } from '../core'
import { AppDrawer, useDrawerState } from '../drawer'
const { deactivateAccount } = deactivateAccountActions
const { getDeactivateAccountStatus } = deactivateAccountSelectors

const MODAL_NAME = 'DeactivateAccountConfirmation'
const messages = {
  confirmTitle: 'Delete Account',
  areYouSureText: 'Are you sure you want to delete your account?',
  doubleCheckText:
    'There is no going back. This will remove all of your tracks, albums, and playlists. You will not be able to re-register with the same email or handle',
  confirmText: 'Delete',
  cancelText: 'Take me back to safety'
}

const useStyles = makeStyles(({ spacing }) => ({
  contentContainer: {
    paddingHorizontal: spacing(6),
    paddingBottom: spacing(4)
  },
  buttonRoot: {
    marginTop: spacing(4)
  },
  text: {
    textAlign: 'center',
    marginBottom: spacing(2)
  }
}))

export const DeactivateAccountConfirmationDrawer = () => {
  const dispatch = useDispatch()
  const styles = useStyles()
  const status = useSelector(getDeactivateAccountStatus)

  const { onClose } = useDrawerState(MODAL_NAME)

  useEffect(() => {
    if (status === Status.SUCCESS) {
      onClose()
    }
  }, [status, onClose])

  const handleConfirmation = useCallback(() => {
    dispatch(deactivateAccount())
  }, [dispatch])

  return (
    <AppDrawer modalName={MODAL_NAME} title={messages.confirmTitle}>
      <View style={styles.contentContainer}>
        <Text variant='body' style={styles.text}>
          {messages.areYouSureText}
        </Text>
        <Text variant='body' style={styles.text}>
          {messages.doubleCheckText}
        </Text>
        <Button
          title={messages.cancelText}
          fullWidth
          styles={{
            root: styles.buttonRoot,
            text: { textTransform: 'uppercase' }
          }}
          onPress={onClose}
          disabled={status !== Status.IDLE}
        />
        <Button
          title={messages.confirmText}
          fullWidth
          styles={{
            root: styles.buttonRoot,
            text: { textTransform: 'uppercase' }
          }}
          variant='destructive'
          onPress={handleConfirmation}
          icon={status === Status.LOADING ? LoadingSpinner : undefined}
          disabled={status !== Status.IDLE}
        />
      </View>
    </AppDrawer>
  )
}
