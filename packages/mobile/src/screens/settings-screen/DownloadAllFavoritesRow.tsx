import { View } from 'react-native'

import { useIsOfflineModeEnabled } from 'app/hooks/useIsOfflineModeEnabled'
import { makeStyles } from 'app/styles'

import { DownloadFavoritesSwitch } from '../favorites-screen/DownloadFavoritesSwitch'

import { SettingsRowLabel } from './SettingRowLabel'
import { SettingsRow } from './SettingsRow'
import { SettingsRowDescription } from './SettingsRowDescription'

const messages = {
  label: 'Download All Favorites',
  body: "Download your favorites so you can listen offline! Albums and playlists you've favorited can also be downloaded individually"
}

const useStyles = makeStyles(({ palette }) => ({
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  labelOff: {
    color: palette.neutralLight4
  }
}))

export const DownloadAllFavoritesRow = () => {
  const isOfflineDownloadEnabled = useIsOfflineModeEnabled()
  const styles = useStyles()

  if (!isOfflineDownloadEnabled) return null

  return (
    <SettingsRow>
      <View style={styles.content}>
        <SettingsRowLabel label={messages.label} />
        <DownloadFavoritesSwitch />
      </View>

      <SettingsRowDescription>{messages.body}</SettingsRowDescription>
    </SettingsRow>
  )
}
