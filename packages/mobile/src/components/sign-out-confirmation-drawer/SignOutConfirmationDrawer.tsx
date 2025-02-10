import { useCallback } from 'react'

import { signOutActions } from '@audius/common/store'
import { useDispatch } from 'react-redux'

import { Text, Flex, Button } from '@audius/harmony-native'
import { AppDrawer, useDrawerState } from 'app/components/drawer/AppDrawer'

const { signOut } = signOutActions

const MODAL_NAME = 'SignOutConfirmation'

const messages = {
  drawerTitle: 'HOLD UP!',
  cancelText: 'Nevermind',
  confirmText: 'Sign Out',
  areYouSureText: 'Are you sure you want to sign out?',
  doubleCheckText:
    'Double check that you have an account recovery email just in case (resend from your settings).'
}

export const SignOutConfirmationDrawer = () => {
  const dispatch = useDispatch()

  const { onClose } = useDrawerState(MODAL_NAME)

  const handleSignOut = useCallback(() => {
    dispatch(signOut())
    onClose()
  }, [dispatch, onClose])

  return (
    <AppDrawer modalName={MODAL_NAME} title={messages.drawerTitle}>
      <Flex gap='m' ph='xl' pv='l'>
        <Text variant='body' size='s' textAlign='center'>
          {messages.areYouSureText}
        </Text>
        <Text variant='body' size='s' textAlign='center'>
          {messages.doubleCheckText}
        </Text>
        <Button fullWidth onPress={onClose}>
          {messages.cancelText}
        </Button>
        <Button fullWidth variant='secondary' onPress={handleSignOut}>
          {messages.confirmText}
        </Button>
      </Flex>
    </AppDrawer>
  )
}
