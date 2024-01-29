import type { ComponentType } from 'react'
import { useCallback, useState } from 'react'

import { View } from 'react-native'
import type { SvgProps } from 'react-native-svg'
import { useDispatch } from 'react-redux'

import { IconCart } from '@audius/harmony-native'
import { IconDownload } from '@audius/harmony-native'
import { IconFavorite } from '@audius/harmony-native'
import { IconRepost } from '@audius/harmony-native'
import { Button, Switch, Text } from 'app/components/core'
import { useDrawer } from 'app/hooks/useDrawer'
import { useIsUSDCEnabled } from 'app/hooks/useIsUSDCEnabled'
import { setVisibility } from 'app/store/drawers/slice'
import { requestDownloadAllFavorites } from 'app/store/offline-downloads/slice'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { HarmonyModalHeader } from '../core/HarmonyModalHeader'
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
    'Use the toggles to select what you’d like synced for offline streaming.',
  comingSoonToggleSuffix: '(coming soon...)',
  favorites: 'Favorites',
  reposts: 'Reposts',
  purchased: 'Purchased',
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

  const isUSDCPurchasesEnabled = useIsUSDCEnabled()

  return (
    <NativeDrawer drawerName='OfflineListening'>
      <View style={styles.container}>
        <HarmonyModalHeader
          icon={IconDownload}
          title={messages.offlineListeningTitle}
        />
        <Text weight='medium' fontSize='large' style={styles.descriptionText}>
          {messages.offlineListeningDescription}
        </Text>
        <OfflineListeningOptionToggle
          title={messages.favorites}
          icon={IconFavorite}
          value={isFavoritesOn}
          onValueChange={handleToggleFavorites}
        />
        <OfflineListeningOptionToggle
          title={`${messages.reposts} ${messages.comingSoonToggleSuffix}`}
          icon={IconRepost}
          value={false}
          disabled
        />
        {isUSDCPurchasesEnabled ? (
          <OfflineListeningOptionToggle
            title={`${messages.purchased} ${messages.comingSoonToggleSuffix}`}
            icon={IconCart}
            value={false}
            disabled
          />
        ) : null}
        <Button
          title={messages.saveChanges}
          fullWidth
          size='large'
          variant='primary'
          onPress={handleSaveChanges}
        />
      </View>
    </NativeDrawer>
  )
}
