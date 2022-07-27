import type { ReactNode, RefObject } from 'react'

import { useSelector } from 'react-redux'

import { SplashScreen, useSplashScreenKey } from 'app/screens/splash-screen'

import WebApp from './components/web/WebApp'
import { getCommonStoreLoaded } from './store/lifecycle/selectors'
import type { MessagePostingWebView } from './types/MessagePostingWebView'

type WebAppManagerProps = {
  webRef: RefObject<MessagePostingWebView>
  children: ReactNode
}

export const WebAppManager = ({ webRef, children }: WebAppManagerProps) => {
  const isCommonStoreLoaded = useSelector(getCommonStoreLoaded)

  // Rekey the splash animation if the dapp loading
  // state changes
  const splashKey = useSplashScreenKey()

  return (
    <>
      <SplashScreen key={`splash-${splashKey}`} />
      <WebApp webRef={webRef} />
      {/*
        Note: it is very important that native components are rendered after WebApp.
        On Android, regardless of position: absolute, WebApp will steal all of
        touch targets and onPress will not work. We also check if the client store
        is initialized before continuing.
      */}
      {isCommonStoreLoaded ? children : null}
    </>
  )
}
