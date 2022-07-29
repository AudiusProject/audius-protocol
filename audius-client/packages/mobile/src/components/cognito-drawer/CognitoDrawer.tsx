import { useCallback, useEffect, useState } from 'react'

import { Status } from '@audius/common'
import {
  getCognitoFlowUrl,
  getCognitoFlowUrlStatus
} from 'audius-client/src/common/store/pages/audio-rewards/selectors'
import {
  CognitoFlowStatus,
  fetchCognitoFlowUrl,
  setCognitoFlowStatus
} from 'audius-client/src/common/store/pages/audio-rewards/slice'
import { StyleSheet, View } from 'react-native'
import WebView from 'react-native-webview'

import { AppDrawer, useDrawerState } from 'app/components/drawer'
import LoadingSpinner from 'app/components/loading-spinner'
import Text from 'app/components/text'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import type { ThemeColors } from 'app/utils/theme'

const MODAL_NAME = 'Cognito'

const messages = {
  error: 'Something Went Wrong.\n Try again later.'
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    spinnerContainer: {
      flexGrow: 1,
      width: '35%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center'
    },
    spinnerFull: {
      width: '100%',
      height: 'auto'
    },
    errorMessageContainer: {
      flexGrow: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    errorMessage: {
      fontSize: 24,
      textAlign: 'center',
      color: themeColors.accentRed,
      lineHeight: 40
    }
  })

export const CognitoDrawer = () => {
  const styles = useThemedStyles(createStyles)
  const dispatchWeb = useDispatchWeb()
  const { isOpen } = useDrawerState(MODAL_NAME)
  const uri = useSelectorWeb(getCognitoFlowUrl)
  const uriStatus = useSelectorWeb(getCognitoFlowUrlStatus)
  const [key, setKey] = useState(0)

  const handleClose = useCallback(() => {
    dispatchWeb(setCognitoFlowStatus({ status: CognitoFlowStatus.CLOSED }))
  }, [dispatchWeb])

  const reload = useCallback(() => {
    setKey((key) => key + 1)
  }, [setKey])

  // On open, fetch the cognito flow url if don't already have one, otherwise refresh
  useEffect(() => {
    if (isOpen && !uri) {
      dispatchWeb(fetchCognitoFlowUrl())
    } else if (isOpen) {
      reload()
    }
  }, [dispatchWeb, reload, isOpen, uri])

  return (
    <AppDrawer
      modalName={MODAL_NAME}
      isFullscreen
      isGestureSupported={false}
      onClose={handleClose}
    >
      {uriStatus === Status.SUCCESS && uri ? (
        <WebView key={key} source={{ uri }} javaScriptEnabled />
      ) : uriStatus === Status.LOADING ? (
        <View style={styles.spinnerContainer}>
          <LoadingSpinner style={styles.spinnerFull} />
        </View>
      ) : (
        <View style={styles.errorMessageContainer}>
          <Text weight='bold' style={styles.errorMessage}>
            {messages.error}
          </Text>
        </View>
      )}
    </AppDrawer>
  )
}
