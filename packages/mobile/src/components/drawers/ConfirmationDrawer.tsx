import { useCallback } from 'react'

import type { Modals } from '@audius/common/store'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import type { IconComponent } from '@audius/harmony-native'
import { Text, IconInfo, Button, Flex, useTheme } from '@audius/harmony-native'
import { AppDrawer, NativeDrawer, useDrawerState } from 'app/components/drawer'
import { useDrawer } from 'app/hooks/useDrawer'
import type { Drawer } from 'app/store/drawers/slice'
import { makeStyles } from 'app/styles'

const defaultMessages = {
  cancel: 'Nevermind'
}

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    paddingHorizontal: spacing(4)
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
  variant?: 'destructive' | 'affirmative'
  icon?: IconComponent
  addBottomInset?: boolean
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
    onClose,
    variant = 'destructive',
    icon: Icon = IconInfo,
    addBottomInset
  } = props
  const messages = { ...defaultMessages, ...messagesProp }
  const insets = useSafeAreaInsets()
  const { spacing } = useTheme()

  const handleConfirm = useCallback(() => {
    onClose()
    onConfirm()
  }, [onClose, onConfirm])

  const handleCancel = useCallback(() => {
    onClose()
    onCancel?.()
  }, [onClose, onCancel])

  return (
    <Flex gap='xl' pv='xl'>
      <Flex
        direction='row'
        gap='s'
        pb='l'
        alignItems='center'
        justifyContent='center'
      >
        <Icon size='xl' color='subdued' />
        <Text variant='label' size='xl' strength='strong' color='subdued'>
          {messages.header}
        </Text>
      </Flex>
      <Text size='l'>{messages.description}</Text>
      <Flex gap='l'>
        <Button
          variant={variant === 'destructive' ? 'destructive' : 'primary'}
          fullWidth
          onPress={handleConfirm}
        >
          {messages.confirm}
        </Button>
        <Button variant='secondary' fullWidth onPress={handleCancel}>
          {messages.cancel}
        </Button>
      </Flex>
      {addBottomInset ? <Flex h={insets.bottom + spacing.xl} /> : null}
    </Flex>
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
