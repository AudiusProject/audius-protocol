import { useCallback } from 'react'

import {
  tokenDashboardPageActions,
  tokenDashboardPageSelectors
} from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'

import { Button, Text } from 'app/components/core'
import { NativeDrawer } from 'app/components/drawer'
import { useDrawer } from 'app/hooks/useDrawer'
import { makeStyles } from 'app/styles'

const { cancelRemoveWallet, confirmRemoveWallet } = tokenDashboardPageActions
const { getRemoveWallet } = tokenDashboardPageSelectors

const drawerName = 'ConfirmRemoveWallet'
const messages = {
  confirmTitle: 'Remove Wallet',
  confirmBody: 'Are you sure you want to remove this linked wallet?',
  confirmText: 'Remove Linked Wallet',
  cancelText: 'Nevermind'
}

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    paddingHorizontal: spacing(4)
  },
  header: {
    textAlign: 'center',
    marginTop: spacing(4),
    marginBottom: spacing(6)
  },
  description: {
    marginBottom: spacing(6),
    textAlign: 'center'
  },
  buttonRoot: {
    marginBottom: spacing(4)
  }
}))

export const ConfirmRemoveWalletDrawer = () => {
  const dispatch = useDispatch()
  const styles = useStyles()

  const { wallet, chain } = useSelector(getRemoveWallet)
  const { onClose } = useDrawer(drawerName)

  const handleConfirmation = useCallback(() => {
    if (wallet && chain) {
      dispatch(confirmRemoveWallet({ wallet, chain }))
      onClose()
    }
  }, [onClose, dispatch, wallet, chain])

  const handleCancel = useCallback(() => {
    dispatch(cancelRemoveWallet())
    onClose()
  }, [dispatch, onClose])

  const { visibleState } = useDrawer(drawerName)

  if (visibleState === false) return null

  return (
    <NativeDrawer
      drawerName={drawerName}
      drawerStyle={styles.root}
      onClose={handleCancel}
    >
      <Text
        fontSize='xl'
        weight='heavy'
        textTransform='uppercase'
        style={styles.header}
      >
        {messages.confirmTitle}
      </Text>

      <Text fontSize='large' style={styles.description}>
        {messages.confirmBody}
      </Text>
      <Button
        title={messages.confirmText}
        fullWidth
        style={styles.buttonRoot}
        variant='destructive'
        onPress={handleConfirmation}
      />
      <Button
        variant='commonAlt'
        title={messages.cancelText}
        fullWidth
        style={styles.buttonRoot}
        onPress={handleCancel}
      />
    </NativeDrawer>
  )
}
