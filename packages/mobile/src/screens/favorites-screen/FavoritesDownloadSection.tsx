import { useState } from 'react'

import { View } from 'react-native'

import { makeStyles } from 'app/styles'

import { DownloadFavoritesSwitch } from './DownloadFavoritesSwitch'
import { DownloadProgress } from './DownloadProgress'
import { FavoritesDownloadStatusIndicator } from './FavoritesDownloadStatusIndicator'

const useStyles = makeStyles(() => ({
  root: { flexDirection: 'row', alignItems: 'center' }
}))

export const FavoritesDownloadSection = () => {
  const styles = useStyles()

  const [switchValue, setSwitchValue] = useState(false)

  return (
    <View style={styles.root}>
      <DownloadProgress />
      <FavoritesDownloadStatusIndicator switchValue={switchValue} />
      <DownloadFavoritesSwitch onValueChange={setSwitchValue} />
    </View>
  )
}
