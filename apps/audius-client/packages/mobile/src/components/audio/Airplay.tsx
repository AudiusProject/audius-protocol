import React, { useEffect, useRef, Ref } from 'react'
import {
  requireNativeComponent,
  NativeEventEmitter,
  NativeModules
} from 'react-native'
import WebView from 'react-native-webview'
import { MessageType } from '../../message/types'
import { postMessage } from '../../utils/postMessage'

const AIRPLAY_PORT_TYPE = 'AirPlay'

const AirplayViewManager = requireNativeComponent('AirplayView')
const { AirplayEvent } = NativeModules
const airplayEventListener = new NativeEventEmitter(AirplayEvent)

type OwnProps = {
  webRef: Ref<WebView>
}

/**
 * An airplay component that talks to the native layer and
 * lets the user broadcast and receive information from
 * a native AVRoutePickerView.
 */
const Airplay = ({ webRef }: OwnProps) => {
  const listenerRef = useRef<any>(null)

  useEffect(() => {
    AirplayEvent.start()
    listenerRef.current = airplayEventListener.addListener(
      'deviceConnected',
      device => {
        console.info(`Connected to device ${device}`)
        if (
          device &&
          device.devices &&
          device.devices[0] &&
          device.devices[0].portType &&
          device.devices[0].portType === AIRPLAY_PORT_TYPE
        ) {
          // If we've found a device, tell the web layer that we are casting
          if (webRef.current) {
            postMessage(webRef.current, {
              type: MessageType.IS_CASTING,
              isCasting: true,
              isAction: true
            })
          }
        } else {
          // If we haven't found one, tell the web layer that we're not casting
          if (webRef.current) {
            postMessage(webRef.current, {
              type: MessageType.IS_CASTING,
              isCasting: false,
              isAction: true
            })
          }
        }
      }
    )

    return () => {
      listenerRef.current?.stop?.()
    }
  }, [webRef, listenerRef])

  return <AirplayViewManager style={{ display: 'none' }} />
}

export default Airplay
