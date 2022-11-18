import { useCallback } from 'react'

import { View } from 'react-native'

import IconInfo from 'app/assets/images/iconInfo.svg'
import { Button, Text } from 'app/components/core'
import { NativeDrawer } from 'app/components/drawer'
import { useDrawer } from 'app/hooks/useDrawer'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

const messages = {
  header: 'Are You Sure?',
  description: 'If you proceed, you will lose any changes you have made.',
  confirm: 'Close and Discard',
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
  },
  bottom: {
    height: spacing(30)
  }
}))

export const CancelUploadDrawer = () => {
  const styles = useStyles()
  const { neutral } = useThemeColors()
  const { onClose } = useDrawer('CancelUpload')
  const navigation = useNavigation()

  const handlePressConfirm = useCallback(() => {
    navigation.goBack()
    onClose()
  }, [navigation, onClose])

  return (
    <NativeDrawer drawerName='CancelUpload' drawerStyle={styles.root}>
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
        onPress={handlePressConfirm}
      />
      <Button
        variant='commonAlt'
        size='large'
        title={messages.cancel}
        fullWidth
        onPress={onClose}
      />
      <View style={styles.bottom} />
    </NativeDrawer>
  )
}
