import { useCallback } from 'react'

import { View } from 'react-native'

import IconInfo from 'app/assets/images/iconInfo.svg'
import { Button, Text } from 'app/components/core'
import { NativeDrawer } from 'app/components/drawer'
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

type ConfirmationDrawerProps = {
  drawerName: Drawer
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

export const ConfirmationDrawer = (props: ConfirmationDrawerProps) => {
  const {
    drawerName,
    messages: messagesProp,
    onConfirm,
    onCancel,
    bottomChinHeight = spacing(6)
  } = props
  const styles = useStyles()
  const { neutral } = useThemeColors()
  const { onClose } = useDrawer(drawerName)
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
    <NativeDrawer drawerName={drawerName} drawerStyle={styles.root}>
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
    </NativeDrawer>
  )
}
