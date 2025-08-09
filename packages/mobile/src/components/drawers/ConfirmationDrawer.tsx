import type { ReactNode } from 'react'
import { useCallback } from 'react'

import type { Modals } from '@audius/common/store'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import type { IconComponent } from '@audius/harmony-native'
import { Text, Button, Flex, useTheme, Divider } from '@audius/harmony-native'
import { AppDrawer, NativeDrawer, useDrawerState } from 'app/components/drawer'
import { useDrawer } from 'app/hooks/useDrawer'
import type { Drawer } from 'app/store/drawers/slice'

const defaultMessages = {
  cancel: 'Cancel'
}

export type BaseConfirmationDrawerProps = {
  messages: {
    header: string
    description: string
    confirm: string
    confirmLoading?: string
    cancel?: string
  }
  onConfirm: () => void
  onCancel?: () => void
  variant?: 'destructive' | 'affirmative'
  icon?: IconComponent
  addBottomInset?: boolean
  children?: ReactNode | ReactNode[]
  isConfirming?: boolean
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

export const ConfirmationDrawerContent = (props: DrawerContentProps) => {
  const {
    messages: messagesProp,
    onConfirm,
    onCancel,
    onClose,
    variant = 'destructive',
    icon: Icon,
    addBottomInset,
    children,
    isConfirming = false
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
    <Flex gap='xl' pv='xl' ph='l'>
      <Flex direction='row' gap='s' alignItems='center' justifyContent='center'>
        {Icon ? <Icon size='xl' color='subdued' /> : null}
        <Text variant='label' size='xl' strength='strong' color='subdued'>
          {messages.header}
        </Text>
      </Flex>
      <Divider />
      <Text size='l' textAlign='center'>
        {messages.description}
      </Text>
      {children}
      <Flex gap='l'>
        <Button
          variant={variant === 'destructive' ? 'destructive' : 'primary'}
          fullWidth
          onPress={handleConfirm}
          disabled={isConfirming}
          isLoading={isConfirming}
        >
          {isConfirming && messages.confirmLoading
            ? messages.confirmLoading
            : messages.confirm}
        </Button>
        <Button
          variant='secondary'
          fullWidth
          onPress={handleCancel}
          disabled={isConfirming}
        >
          {messages.cancel}
        </Button>
      </Flex>
      {addBottomInset ? <Flex h={insets.bottom + spacing.xl} /> : null}
    </Flex>
  )
}

const NativeConfirmationDrawer = (props: NativeConfirmationDrawerProps) => {
  const { drawerName, ...other } = props
  const { onCancel } = other
  const { onClose } = useDrawer(drawerName)

  return (
    <NativeDrawer drawerName={drawerName} onClose={onCancel}>
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
  const { onClose } = useDrawerState(modalName)

  return (
    <AppDrawer modalName={modalName} onClose={onCancel}>
      <ConfirmationDrawerContent onClose={onClose} {...other} />
    </AppDrawer>
  )
}
