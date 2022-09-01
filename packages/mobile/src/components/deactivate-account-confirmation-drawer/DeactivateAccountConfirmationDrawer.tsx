import { useCallback } from 'react'

import { deactivateAccount } from 'audius-client/src/pages/deactivate-account-page/store/slice'
import { View } from 'react-native'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { makeStyles } from 'app/styles'

import { Button, Text } from '../core'
import { AppDrawer, useDrawerState } from '../drawer'

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
  const dispatchWeb = useDispatchWeb()
  const styles = useStyles()

  const { onClose } = useDrawerState(MODAL_NAME)

  const handleConfirmation = useCallback(() => {
    dispatchWeb(deactivateAccount)
  }, [dispatchWeb])

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
        />
      </View>
    </AppDrawer>
  )
}
