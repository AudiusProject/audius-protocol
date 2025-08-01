import type { ComponentType } from 'react'
import { useCallback, useState } from 'react'

import { View } from 'react-native'
import type { SvgProps } from 'react-native-svg'
import { useDispatch } from 'react-redux'

import { IconCloudDownload, IconHeart, Button } from '@audius/harmony-native'
import { Switch, Text } from 'app/components/core'
import { useDrawer } from 'app/hooks/useDrawer'
import { setVisibility } from 'app/store/drawers/slice'
import { requestDownloadAllFavorites } from 'app/store/offline-downloads/slice'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { DrawerHeader } from '../core/DrawerHeader'
import { NativeDrawer } from '../drawer'

const useDrawerStyles = makeStyles(({ spacing, palette, typography }) => ({
  container: {
    paddingVertical: spacing(6),
    flexDirection: 'column',
    paddingHorizontal: spacing(4),
    rowGap: spacing(6),
    alignItems: 'center'
  },
  descriptionText: {
    textAlign: 'center',
    lineHeight: typography.fontSize.large * 1.3
  },
  titleIcon: {
    position: 'relative',
    top: 7,
    color: palette.neutral,
    marginRight: spacing(3)
  }
}))

const useToggleStyles = makeStyles(({ spacing, palette }) => ({
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center'
  },
  titleContainer: {
    columnGap: spacing(2),
    flexDirection: 'row'
  }
}))

const messages = {
  offlineListeningTitle: 'Offline Listening',
  offlineListeningDescription:
    "Use the toggles to select what you'd like synced for offline streaming.",
  favorites: 'Favorites',
  saveChanges: 'Save Changes'
}

type OfflineListeningOptionToggleProps = {
  title: string
  icon: ComponentType<SvgProps>
  value: boolean
  onValueChange?: (value: boolean) => void | Promise<void>
  disabled?: boolean
}

const OfflineListeningOptionToggle = ({
  title,
  icon: Icon,
  value,
  onValueChange,
  disabled
}: OfflineListeningOptionToggleProps) => {
  const styles = useToggleStyles()
  const { neutral, neutralLight4 } = useThemeColors()

  return (
    <View style={styles.toggleContainer}>
      <View style={styles.titleContainer}>
        <Icon
          fill={disabled ? neutralLight4 : neutral}
          height={20}
          width={20}
        />
        <Text
          weight='demiBold'
          fontSize='large'
          color={disabled ? 'neutralLight4' : 'neutral'}
        >
          {title}
        </Text>
      </View>
      <Switch value={value} disabled={disabled} onValueChange={onValueChange} />
    </View>
  )
}

export const OfflineListeningDrawer = () => {
  const styles = useDrawerStyles()
  const dispatch = useDispatch()
  const { data, onClose } = useDrawer('OfflineListening')
  const { isFavoritesMarkedForDownload, onSaveChanges } = data

  const [isFavoritesOn, setIsFavoritesOn] = useState(
    isFavoritesMarkedForDownload
  )

  const handleSaveChanges = useCallback(() => {
    if (isFavoritesMarkedForDownload && !isFavoritesOn) {
      dispatch(
        setVisibility({
          drawer: 'RemoveDownloadedFavorites',
          visible: true
        })
      )
      onSaveChanges(isFavoritesOn)
    } else if (!isFavoritesMarkedForDownload && isFavoritesOn) {
      dispatch(requestDownloadAllFavorites())
      onSaveChanges(isFavoritesOn)
    }

    onClose()
  }, [
    dispatch,
    isFavoritesMarkedForDownload,
    isFavoritesOn,
    onClose,
    onSaveChanges
  ])

  const handleToggleFavorites = useCallback((value: boolean) => {
    setIsFavoritesOn(value)
  }, [])

  return (
    <NativeDrawer drawerName='OfflineListening'>
      <View style={styles.container}>
        <DrawerHeader
          icon={IconCloudDownload}
          title={messages.offlineListeningTitle}
        />
        <Text weight='medium' fontSize='large' style={styles.descriptionText}>
          {messages.offlineListeningDescription}
        </Text>
        <OfflineListeningOptionToggle
          title={messages.favorites}
          icon={IconHeart}
          value={isFavoritesOn}
          onValueChange={handleToggleFavorites}
        />
        <Button fullWidth variant='primary' onPress={handleSaveChanges}>
          {messages.saveChanges}
        </Button>
      </View>
    </NativeDrawer>
  )
}
