import React, { useCallback } from 'react'

import { Platform, StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'

import Drawer from 'app/components/drawer'
import LoadingSpinner from 'app/components/loading-spinner'
import Text from 'app/components/text'
import { useDrawer } from 'app/hooks/useDrawer'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import {
  getDownloadedPercentage,
  getFileName,
  getFetchCancel
} from 'app/store/download/selectors'
import { useColor, ThemeColors } from 'app/utils/theme'

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
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
      color: themeColors.actionSheetText,
      marginBottom: 28
    },

    fileName: {
      fontSize: 18,
      lineHeight: 24,
      color: themeColors.neutralLight4,
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
    },

    downloadPercent: {
      fontSize: 40,
      color: themeColors.neutral,
      lineHeight: 46
    }
  })

const messages = {
  title: 'Downloading'
}

const DownloadTrackProgressDrawer = () => {
  const [isOpen, setIsOpen] = useDrawer('DownloadTrackProgress')

  const downloadPercentage = useSelector(getDownloadedPercentage)
  const fetchCancel = useSelector(getFetchCancel)
  const fileName = useSelector(getFileName)

  const handleClose = useCallback(() => {
    fetchCancel()
    setIsOpen(false)
  }, [fetchCancel, setIsOpen])

  const styles = useThemedStyles(createStyles)
  const spinnerColor = useColor('actionSheetText')

  return (
    <Drawer isOpen={isOpen} onClose={handleClose}>
      <View style={styles.view}>
        <Text style={styles.title} weight='bold'>
          {messages.title}
        </Text>
        <Text style={styles.fileName} weight='bold'>
          {fileName}
        </Text>
        <View style={styles.downloadContainer}>
          <LoadingSpinner style={styles.loadingIcon} color={spinnerColor} />
          {Platform.OS === 'ios' ? (
            <Text style={styles.downloadPercent} weight='heavy'>
              {Math.round(downloadPercentage)}%
            </Text>
          ) : null}
        </View>
      </View>
    </Drawer>
  )
}

export default DownloadTrackProgressDrawer
