import { AudiusSdk, sdk } from '@audius/sdk'
import { ReactNode, createContext, useContext, useMemo } from 'react'

const AudiusSdkContext = createContext<AudiusSdk | null>(null);

export const AudiusSdkProvider = ({ children }: { children: ReactNode}) => {
  const audiusSdk = useMemo(() => sdk({
    appName: 'ddex'
  }), [])

  return (
    <AudiusSdkContext.Provider value={audiusSdk}>
      {children}
    </AudiusSdkContext.Provider>
  )
}

export const useSdk = () => useContext(AudiusSdkContext)
