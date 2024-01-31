import { useCallback } from 'react'

import type { StripeSessionData } from '@audius/common/store'
import {
  stripeModalUIActions,
  stripeModalUISelectors
} from '@audius/common/store'

import { View } from 'react-native'
import { WebView } from 'react-native-webview'
import { useDispatch, useSelector } from 'react-redux'

import { env } from 'app/env'
import { useIsUSDCEnabled } from 'app/hooks/useIsUSDCEnabled'
import { makeStyles } from 'app/styles'

import LoadingSpinner from '../loading-spinner/LoadingSpinner'

const { getStripeClientSecret } = stripeModalUISelectors
const { stripeSessionStatusChanged, cancelStripeOnramp } = stripeModalUIActions

const STRIPE_PUBLISHABLE_KEY = env.STRIPE_CLIENT_PUBLISHABLE_KEY

const useStyles = makeStyles(() => ({
  root: {
    display: 'flex',
    flex: 1,
    height: '100%'
  },
  spinnerContainer: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  }
}))

export const StripeOnrampEmbed = () => {
  const styles = useStyles()
  const dispatch = useDispatch()
  const isUSDCEnabled = useIsUSDCEnabled()
  const clientSecret = useSelector(getStripeClientSecret)

  const handleSessionUpdate = useCallback(
    (event) => {
      try {
        const session = JSON.parse(event.nativeEvent.data) as StripeSessionData
        if (session) {
          dispatch(stripeSessionStatusChanged({ session }))
          if (session.status === 'error') {
            dispatch(cancelStripeOnramp())
          }
        }
      } catch (e) {
        console.error(`Failed to parse Stripe session update: ${e}`)
      }
    },
    [dispatch]
  )

  const handleError = useCallback(
    (event) => {
      const { nativeEvent } = event
      console.error('Stripe WebView onError: ', nativeEvent)
      dispatch(cancelStripeOnramp())
    },
    [dispatch]
  )

  const renderLoadingSpinner = useCallback(
    () => (
      <View style={styles.spinnerContainer}>
        <LoadingSpinner />
      </View>
    ),
    [styles]
  )

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Crypto Onramp</title>
    <meta name="description" content="A demo of hosted onramp" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://js.stripe.com/v3/"></script>
    <script type="text/javascript" src="https://crypto-js.stripe.com/crypto-onramp-outer.js"></script>
  </head>
  <body>
    <div id="onramp-element" />
    <script type="text/javascript">
      const handleSessionUpdate = (event) => {
        window.ReactNativeWebView.postMessage(JSON.stringify(event.payload.session))
      }
      try {
        const onramp = new window.StripeOnramp("${STRIPE_PUBLISHABLE_KEY}")
        const session = onramp.createSession({clientSecret:"${clientSecret}"})
        session.mount('#onramp-element')
        session.addEventListener('onramp_session_updated', handleSessionUpdate)
      } catch (e) {
        window.ReactNativeWebView.postMessage(e)
      }
    </script>
  </body>
  </html>
  `

  if (!STRIPE_PUBLISHABLE_KEY) {
    console.error('Stripe publishable key not found')
    return null
  }

  if (!isUSDCEnabled) return null

  return (
    <View style={styles.root}>
      {clientSecret ? (
        <WebView
          source={{ html }}
          startInLoadingState={true}
          renderLoading={renderLoadingSpinner}
          scrollEnabled
          onError={handleError}
          onMessage={handleSessionUpdate}
        />
      ) : (
        renderLoadingSpinner()
      )}
    </View>
  )
}
