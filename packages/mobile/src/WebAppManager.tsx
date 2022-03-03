import { ReactNode } from 'react'

import { isEmpty } from 'lodash'
import { useSelector } from 'react-redux'

import { AppState } from './store'

type WebAppManagerProps = {
  webApp: JSX.Element
  children: ReactNode
}

export const WebAppManager = ({ webApp, children }: WebAppManagerProps) => {
  const commonState = useSelector((state: AppState) => state.common)
  const isClientStoreEmpty = isEmpty(commonState)
  return (
    <>
      {webApp}
      {/*
        Note: it is very important that native components are rendered after WebApp.
        On Android, regardless of position: absolute, WebApp will steal all of
        touch targets and onPress will not work. We also check if the client store
        is initialized before continuing.
      */}
      {isClientStoreEmpty ? null : children}
    </>
  )
}
