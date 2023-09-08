import { useCallback, useState } from 'react'

import { View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useDispatch, useSelector } from 'react-redux'

import { setVisibility } from 'app/store/drawers/slice'
import { DOWNLOAD_REASON_FAVORITES } from 'app/store/offline-downloads/constants'
import { getCollectionDownloadStatus } from 'app/store/offline-downloads/selectors'
import { makeStyles } from 'app/styles'

import { DownloadProgress } from './DownloadProgress'
import { FavoritesDownloadStatusIndicator } from './FavoritesDownloadStatusIndicator'

const useStyles = makeStyles(() => ({
  root: { flexDirection: 'row', alignItems: 'center' }
}))

const OfflineListeningIndicatorButton = () => {
  const dispatch = useDispatch()
  const isFavoritesMarkedForDownload = useSelector((state) =>
    Boolean(getCollectionDownloadStatus(state, DOWNLOAD_REASON_FAVORITES))
  )
  const [switchValue, setSwitchValue] = useState(isFavoritesMarkedForDownload)

  const handlePressStatusIndicator = useCallback(() => {
    dispatch(
      setVisibility({
        drawer: 'OfflineListening',
        visible: true,
        data: {
          isFavoritesMarkedForDownload: switchValue,
          onSaveChanges: setSwitchValue
        }
      })
    )
  }, [dispatch, switchValue])

  return (
    <TouchableOpacity onPress={handlePressStatusIndicator}>
      <FavoritesDownloadStatusIndicator switchValue={switchValue} />
    </TouchableOpacity>
  )
}

export const FavoritesDownloadSection = () => {
  const styles = useStyles()

  return (
    <View style={styles.root}>
      <DownloadProgress />
      <OfflineListeningIndicatorButton />
    </View>
  )
}
