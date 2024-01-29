import { useCallback } from 'react'

import { View } from 'react-native'
import { useSelector } from 'react-redux'

import { NativeDrawer } from 'app/components/drawer'
import LoadingSpinner from 'app/components/loading-spinner'
import Text from 'app/components/text'
import { getFileName, getFetchCancel } from 'app/store/download/selectors'
import { makeStyles } from 'app/styles'
import { useColor } from 'app/utils/theme'

const useStyles = makeStyles(({ palette }) => ({
  view: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 24,
    fontFamily: 'AvenirNextLTPro-Regular'
  },

  title: {
    fontSize: 21,
    color: palette.secondary,
    marginBottom: 28
  },

  fileName: {
    fontSize: 18,
    lineHeight: 24,
    color: palette.neutralLight4,
    marginBottom: 12,
    textAlign: 'center'
  },

  downloadContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32
  },

  loadingIcon: {
    width: 40,
    height: 40,
    alignSelf: 'flex-start',
    marginRight: 10
  }
}))

const messages = {
  title: 'Downloading'
}

export const DownloadTrackProgressDrawer = () => {
  const fetchCancel = useSelector(getFetchCancel)
  const fileName = useSelector(getFileName)

  const handleClose = useCallback(() => {
    fetchCancel?.()
  }, [fetchCancel])

  const styles = useStyles()
  const spinnerColor = useColor('secondary')

  return (
    <NativeDrawer drawerName='DownloadTrackProgress' onClose={handleClose}>
      <View style={styles.view}>
        <Text style={styles.title} weight='bold'>
          {messages.title}
        </Text>
        <Text style={styles.fileName} weight='bold'>
          {fileName}
        </Text>
        <View style={styles.downloadContainer}>
          <LoadingSpinner style={styles.loadingIcon} color={spinnerColor} />
        </View>
      </View>
    </NativeDrawer>
  )
}
