import { useCallback } from 'react'

import type { Modals } from '@audius/common'
import { View } from 'react-native'

import { IconInfo } from '@audius/harmony-native'
import { Button, Text } from 'app/components/core'
import { AppDrawer, NativeDrawer, useDrawerState } from 'app/components/drawer'
import { useDrawer } from 'app/hooks/useDrawer'
import type { Drawer } from 'app/store/drawers/slice'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

const defaultMessages = {
  cancel: 'Nevermind'
}

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    paddingHorizontal: spacing(4)
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing(4),
    marginBottom: spacing(6)
  },
  headerIcon: {
    marginRight: spacing(3)
  },
  description: {
    marginBottom: spacing(4),
    textAlign: 'center'
  },
  confirmButton: {
    marginBottom: spacing(4)
  }
}))

type BaseConfirmationDrawerProps = {
  messages: {
    header: string
    description: string
    confirm: string
    cancel?: string
  }
  onConfirm: () => void
  onCancel?: () => void
  bottomChinHeight?: number
}

type NativeConfirmationDrawerProps = BaseConfirmationDrawerProps & {
  drawerName: Drawer
}

type CommonConfirmationDrawerProps = BaseConfirmationDrawerProps & {
  modalName: Modals
}

type ConfirmationDrawerProps =
  | NativeConfirmationDrawerProps
  | CommonConfirmationDrawerProps

type DrawerContentProps = BaseConfirmationDrawerProps & {
  onClose: () => void
}

const ConfirmationDrawerContent = (props: DrawerContentProps) => {
  const {
    messages: messagesProp,
    onConfirm,
    onCancel,
    bottomChinHeight = spacing(6),
    onClose
  } = props
  const styles = useStyles()
  const { neutral } = useThemeColors()
  const messages = { ...defaultMessages, ...messagesProp }

  const handleConfirm = useCallback(() => {
    onClose()
    onConfirm()
  }, [onClose, onConfirm])

  const handleCancel = useCallback(() => {
    onClose()
    onCancel?.()
  }, [onClose, onCancel])

  return (
    <>
      <View style={styles.header}>
        <IconInfo
          style={styles.headerIcon}
          height={spacing(5)}
          width={spacing(5)}
          fill={neutral}
        />
        <Text fontSize='xl' weight='heavy' textTransform='uppercase'>
          {messages.header}
        </Text>
      </View>
      <Text fontSize='large' style={styles.description}>
        {messages.description}
      </Text>
      <Button
        variant='destructive'
        size='large'
        title={messages.confirm}
        style={styles.confirmButton}
        fullWidth
        onPress={handleConfirm}
      />
      <Button
        variant='commonAlt'
        size='large'
        title={messages.cancel}
        fullWidth
        onPress={handleCancel}
      />
      <View style={{ height: bottomChinHeight }} />
    </>
  )
}

const NativeConfirmationDrawer = (props: NativeConfirmationDrawerProps) => {
  const styles = useStyles()
  const { drawerName, ...other } = props
  const { onCancel } = other
  const { onClose } = useDrawer(drawerName)

  return (
    <NativeDrawer
      drawerName={drawerName}
      drawerStyle={styles.root}
      onClose={onCancel}
    >
      <ConfirmationDrawerContent onClose={onClose} {...other} />
    </NativeDrawer>
  )
}

export const ConfirmationDrawer = (props: ConfirmationDrawerProps) => {
  return 'drawerName' in props ? (
    <NativeConfirmationDrawer {...props} />
  ) : (
    <CommonConfirmationDrawer {...props} />
  )
}

const CommonConfirmationDrawer = (props: CommonConfirmationDrawerProps) => {
  const { modalName, ...other } = props
  const { onCancel } = other
  const styles = useStyles()
  const { onClose } = useDrawerState(modalName)

  return (
    <AppDrawer
      modalName={modalName}
      drawerStyle={styles.root}
      onClose={onCancel}
    >
      <ConfirmationDrawerContent onClose={onClose} {...other} />
    </AppDrawer>
  )
}
