import { Screen, ScreenContent } from 'app/components/core'

import { SettingsDivider } from './SettingsDivider'
import { DownloadAllFavoritesRow } from './DownloadAllFavoritesRow'
import { DownloadNetworkPreferenceRow } from './DownloadNetworkPreferenceRow'
import { RemoveAllDownloadsRow } from './RemoveAllDownloadsRow'

const messages = {
  title: 'Download Settings'
}

export const DownloadSettingsScreen = () => {
  return (
    <Screen title={messages.title} variant='secondary' topbarRight={null}>
      <ScreenContent>
        <SettingsDivider />
        <DownloadAllFavoritesRow />
        <DownloadNetworkPreferenceRow />
        <RemoveAllDownloadsRow />
      </ScreenContent>
    </Screen>
  )
}
