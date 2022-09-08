import { useCallback, useEffect, useState } from 'react'

import {
  Status,
  audioRewardsPageActions,
  CognitoFlowStatus,
  audioRewardsPageSelectors
} from '@audius/common'
import { StyleSheet, View } from 'react-native'
import WebView from 'react-native-webview'
import { useDispatch, useSelector } from 'react-redux'

import { AppDrawer, useDrawerState } from 'app/components/drawer'
import LoadingSpinner from 'app/components/loading-spinner'
import Text from 'app/components/text'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import type { ThemeColors } from 'app/utils/theme'
const { getCognitoFlowUrl, getCognitoFlowUrlStatus } = audioRewardsPageSelectors
const { fetchCognitoFlowUrl, setCognitoFlowStatus } = audioRewardsPageActions

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
  const dispatch = useDispatch()
  const { isOpen } = useDrawerState(MODAL_NAME)
  const uri = useSelector(getCognitoFlowUrl)
  const uriStatus = useSelector(getCognitoFlowUrlStatus)
  const [key, setKey] = useState(0)

  const handleClose = useCallback(() => {
    dispatch(setCognitoFlowStatus({ status: CognitoFlowStatus.CLOSED }))
  }, [dispatch])

  const reload = useCallback(() => {
    setKey((key) => key + 1)
  }, [setKey])

  // On open, fetch the cognito flow url if don't already have one, otherwise refresh
  useEffect(() => {
    if (isOpen && !uri) {
      dispatch(fetchCognitoFlowUrl())
    } else if (isOpen) {
      reload()
    }
  }, [dispatch, reload, isOpen, uri])

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
