import { useCallback } from 'react'

import { StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'

import { useIsUSDCEnabled } from 'app/hooks/useIsUSDCEnabled'
import { useRoute } from 'app/hooks/useRoute'
import { env } from 'app/services/env'

const STRIPE_PUBLISHABLE_KEY = env.REACT_APP_STRIPE_CLIENT_PUBLISHABLE_KEY

const styles = StyleSheet.create({
  root: {
    height: '100%',
    width: '100%'
  }
})

export const StripeOnrampEmbed = () => {
  const { params } = useRoute<'StripeOnrampEmbed'>()
  const { clientSecret } = params
  const isUSDCEnabled = useIsUSDCEnabled()

  const handleSessionUpdate = useCallback((event) => {
    if (event?.payload?.session?.status) {
      console.log(`Stripe Session Update ${event.payload.session.status}`)
    }
  }, [])

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
        window.ReactNativeWebView.postMessage(event)
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

  if (!clientSecret) {
    console.error('Stripe client secret not found')
    return null
  }

  if (!isUSDCEnabled) return null

  return (
    <View style={styles.root}>
      <WebView
        source={{ html }}
        scrollEnabled={false}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent
          console.error('Stripe WebView onError: ', nativeEvent)
        }}
        onMessage={handleSessionUpdate}
      />
    </View>
  )
}
