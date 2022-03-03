import { signOut } from 'audius-client/src/common/store/sign-out/slice'
import { View } from 'react-native'

import { Button, Text } from 'app/components/core'
import { AppDrawer, useDrawerState } from 'app/components/drawer/AppDrawer'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { makeStyles } from 'app/styles'

const MODAL_NAME = 'SignOutConfirmation'

const messages = {
  drawerTitle: 'HOLD UP!',
  cancelText: 'Nevermind',
  confirmText: 'Sign Out',
  areYouSureText: 'Are you sure you want to sign out?',
  doubleCheckText:
    'Double check that you have an account recovery email just in case (resend from your settings).'
}

const useStyles = makeStyles(({ palette, spacing }) => ({
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

export const SignOutConfirmationDrawer = () => {
  const styles = useStyles()
  const dispatchWeb = useDispatchWeb()

  const { onClose } = useDrawerState(MODAL_NAME)

  const handleSignOut = () => {
    dispatchWeb(signOut)
    onClose()
  }

  return (
    <AppDrawer modalName={MODAL_NAME} title={messages.drawerTitle}>
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
          variant='common'
          onPress={handleSignOut}
        />
      </View>
    </AppDrawer>
  )
}
