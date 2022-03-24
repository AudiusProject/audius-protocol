import { useEffect, useRef } from 'react'

import { setIsCasting } from 'common/store/cast/slice'
import {
  requireNativeComponent,
  NativeEventEmitter,
  NativeModules
} from 'react-native'

import { useDispatchWeb } from 'app/hooks/useDispatchWeb'

const AIRPLAY_PORT_TYPE = 'AirPlay'

const AirplayViewManager = requireNativeComponent('AirplayView')
const { AirplayEvent } = NativeModules
const airplayEventListener = new NativeEventEmitter(AirplayEvent)

/**
 * An airplay component that talks to the native layer and
 * lets the user broadcast and receive information from
 * a native AVRoutePickerView.
 */
const Airplay = () => {
  const listenerRef = useRef<any>(null)
  const dispatchWeb = useDispatchWeb()

  useEffect(() => {
    // On mount, we start scanning the network for airplay devices
    // and listen for changes to `deviceConnected`
    AirplayEvent.startScan()
    listenerRef.current = airplayEventListener.addListener(
      'deviceConnected',
      device => {
        console.info(`Connected to device ${JSON.stringify(device)}`)
        if (
          device &&
          device.devices &&
          device.devices[0] &&
          device.devices[0].portType &&
          device.devices[0].portType === AIRPLAY_PORT_TYPE
        ) {
          dispatchWeb(setIsCasting({ isCasting: true }))
        } else {
          dispatchWeb(setIsCasting({ isCasting: false }))
        }
      }
    )

    return () => {
      listenerRef.current?.stop?.()
    }
  }, [listenerRef, dispatchWeb])

  return <AirplayViewManager />
}

export default Airplay
