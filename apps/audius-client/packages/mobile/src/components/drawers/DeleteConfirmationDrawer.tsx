import { useCallback } from 'react'

import { cacheTracksActions } from '@audius/common'
import { View } from 'react-native'
import { useDispatch } from 'react-redux'

import IconInfo from 'app/assets/images/iconInfo.svg'
import { Button, Text } from 'app/components/core'
import { NativeDrawer } from 'app/components/drawer'
import { useDrawer } from 'app/hooks/useDrawer'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

import { navigationRef } from '../navigation-container/NavigationContainer'

const { deleteTrack } = cacheTracksActions

const messages = {
  header: 'Delete Track',
  description: 'This Track Will Disappear For Everyone',
  areYouSureText: 'Are you sure you want to delete this track?',
  confirm: 'Delete Track',
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

const drawerName = 'DeleteConfirmation'

export const DeleteConfirmationDrawer = () => {
  const styles = useStyles()
  const { neutral } = useThemeColors()
  const { onClose, data } = useDrawer(drawerName)
  const trackId = data?.id
  const dispatch = useDispatch()
  const navigation = useNavigation()

  const handleDelete = useCallback(() => {
    dispatch(deleteTrack(trackId))
    onClose()
    const currentRouteName = navigationRef.getCurrentRoute()?.name
    if (currentRouteName === 'Track') {
      navigation.goBack()
    }
  }, [dispatch, onClose, trackId, navigation])

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
        onPress={handleDelete}
      />
      <Button
        variant='commonAlt'
        size='large'
        title={messages.cancel}
        fullWidth
        onPress={onClose}
      />
    </NativeDrawer>
  )
}
