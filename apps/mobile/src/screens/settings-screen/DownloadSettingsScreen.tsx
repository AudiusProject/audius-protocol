import { Screen, ScreenContent } from 'app/components/core'

import { Divider } from './Divider'
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
        <Divider />
        <DownloadAllFavoritesRow />
        <DownloadNetworkPreferenceRow />
        <RemoveAllDownloadsRow />
      </ScreenContent>
    </Screen>
  )
}
