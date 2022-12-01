import { useCallback } from 'react'

import {
  tokenDashboardPageActions,
  tokenDashboardPageSelectors
} from '@audius/common'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { useDrawer } from 'app/hooks/useDrawer'
import { makeStyles } from 'app/styles'

import { Button, Text } from '../core'
import { NativeDrawer } from '../drawer'

const { confirmRemoveWallet } = tokenDashboardPageActions
const { getRemoveWallet } = tokenDashboardPageSelectors

const drawerName = 'ConfirmRemoveWallet'
const messages = {
  confirmTitle: 'Are You Sure?',
  confirmBody: 'Are you sure you want to remove this linked wallet?',
  confirmText: 'Remove Linked Wallet',
  cancelText: 'Nevermind'
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

  return (
    <NativeDrawer drawerName={drawerName}>
      <View style={styles.contentContainer}>
        <Text variant='body' style={styles.text}>
          {messages.confirmBody}
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
    </NativeDrawer>
  )
}
