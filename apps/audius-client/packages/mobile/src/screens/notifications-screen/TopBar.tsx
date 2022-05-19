import { useCallback, useContext } from 'react'

import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import IconRemove from 'app/assets/images/iconRemove.svg'
import { IconButton, Text } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { Theme } from 'app/utils/theme'

import { NotificationsDrawerNavigationContext } from './NotificationsDrawerNavigationContext'

const messages = {
  notifications: 'notifications'
}

const useStyles = makeStyles(({ spacing, palette, type }) => ({
  root: {
    height: 55,
    backgroundColor: palette.secondary
  },
  container: {
    position: 'absolute',
    bottom: spacing(1),
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing(1)
  },
  title: {
    textTransform: 'uppercase',
    color: type === Theme.MATRIX ? palette.white : palette.staticWhite,
    alignSelf: 'center'
  },
  iconClose: {
    height: 30,
    width: 30
  },
  spacer: {
    // This value fully centers the notification text
    width: 36
  }
}))

export const TopBar = () => {
  const styles = useStyles()
  const { drawerHelpers } = useContext(NotificationsDrawerNavigationContext)

  const handleClose = useCallback(() => {
    drawerHelpers?.closeDrawer()
  }, [drawerHelpers])

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.container}>
        <IconButton
          icon={IconRemove}
          onPress={handleClose}
          fill={styles.title.color}
          styles={{ icon: styles.iconClose }}
        />
        <Text style={styles.title} variant='h1' noGutter weight='heavy'>
          {messages.notifications}
        </Text>
        <View style={styles.spacer} />
      </View>
    </SafeAreaView>
  )
}
