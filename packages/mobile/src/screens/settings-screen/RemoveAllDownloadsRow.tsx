import { useCallback } from 'react'

import { useDispatch, useSelector } from 'react-redux'
import { createSelector } from 'reselect'

import { Button } from '@audius/harmony-native'
import { setVisibility } from 'app/store/drawers/slice'
import { getOfflineCollectionsStatus } from 'app/store/offline-downloads/selectors'
import { makeStyles } from 'app/styles'

import { SettingsRowLabel } from './SettingRowLabel'
import { SettingsRow } from './SettingsRow'
import { SettingsRowDescription } from './SettingsRowDescription'

const messages = {
  label: 'Remove All Downloaded Content',
  body: 'This will remove all downloads from your device, including playlists and albums that have been individually marked for download. This cannot be undone.',
  button: 'Remove From My Device'
}

const useStyles = makeStyles(({ spacing }) => ({
  button: {
    marginTop: spacing(2)
  }
}))

const getIsAnyCollectionDownloaded = createSelector(
  getOfflineCollectionsStatus,
  (offlineCollectionStatus) => {
    return Object.values(offlineCollectionStatus).length > 0
  }
)

export const RemoveAllDownloadsRow = () => {
  const dispatch = useDispatch()
  const styles = useStyles()
  const isAnyCollectionDownloaded = useSelector(getIsAnyCollectionDownloaded)

  const handleRemoveAllDownloads = useCallback(() => {
    dispatch(
      setVisibility({
        drawer: 'RemoveAllDownloads',
        visible: true
      })
    )
  }, [dispatch])

  if (!isAnyCollectionDownloaded) return null

  return (
    <SettingsRow>
      <SettingsRowLabel label={messages.label} />
      <SettingsRowDescription>{messages.body}</SettingsRowDescription>
      <Button
        onPress={handleRemoveAllDownloads}
        variant='destructive'
        style={styles.button}
        fullWidth
      >
        {messages.button}
      </Button>
    </SettingsRow>
  )
}
