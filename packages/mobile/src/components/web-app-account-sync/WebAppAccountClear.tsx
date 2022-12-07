import { useEffect, useRef } from 'react'

import { getErrorMessage } from '@audius/common'
import { Platform, View } from 'react-native'
import RNFS from 'react-native-fs'
import StaticServer from 'react-native-static-server'
import { WebView } from 'react-native-webview'
import { useAsync } from 'react-use'

// Clear on any message
const injected = `
(function() {
  document.addEventListener("message", (event) => {
    window.localStorage.clear()
  })
})();
`

type WebAppAccountClearProps = {
  shouldClear: boolean
}

/**
 * Used to clear the entropy from the legacy WebView
 */
export const WebAppAccountClear = ({
  shouldClear
}: WebAppAccountClearProps) => {
  const ref = useRef<WebView>(null)

  const { value: uri, error } = useAsync(async () => {
    const server =
      Platform.OS === 'android'
        ? new StaticServer(3100, RNFS.DocumentDirectoryPath, {
            localOnly: true,
            keepAlive: true
          })
        : new StaticServer(
            // Hardcoding to prod port because ios crashes otherwise
            3100,
            {
              localOnly: true,
              keepAlive: true
            }
          )

    return await server.start()
  }, [])

  useEffect(() => {
    if (shouldClear) {
      ref.current?.postMessage('clear')
    }
  }, [shouldClear])

  if (error) {
    console.error(
      'WebAppAccountClear Error -- StaticServer: ',
      getErrorMessage(error)
    )
  }

  return uri ? (
    <View style={{ display: 'none' }}>
      <WebView ref={ref} injectedJavaScript={injected} source={{ uri }} />
    </View>
  ) : null
}
