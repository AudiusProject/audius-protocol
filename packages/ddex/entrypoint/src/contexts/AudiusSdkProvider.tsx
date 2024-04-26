import { AudiusSdk, DiscoveryNodeSelector, productionConfig, sdk, stagingConfig } from '@audius/sdk'
import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Status } from './types';

const env = import.meta.env.VITE_ENVIRONMENT as 'dev' | 'stage' | 'prod'

type AudiusSdkContext = {
  sdk: AudiusSdk | null
  status: Status
}

const AudiusSdkContext = createContext<AudiusSdkContext>({
  sdk: null,
  status: Status.IDLE
})


export const AudiusSdkProvider = ({ children }: { children: ReactNode}) => {
  const [status, setStatus] = useState(Status.IDLE)
  const [audiusSdk, setAudiusSdk] = useState<AudiusSdk | null>(null)
  
  useEffect(() => {
    const config = env === 'prod' ? productionConfig : stagingConfig
    const discoveryNodeSelector = new DiscoveryNodeSelector({
      bootstrapServices: config.discoveryNodes,
    })
  
    const instance = sdk({
      appName: 'ddex',
      services: {
        discoveryNodeSelector
      }
    })
    setAudiusSdk(instance)
    setStatus(Status.SUCCESS)
  }, [])

  return (
    <AudiusSdkContext.Provider value={{ sdk: audiusSdk, status }}>
      {children}
    </AudiusSdkContext.Provider>
  )
}

export const useSdk = () => useContext(AudiusSdkContext)
