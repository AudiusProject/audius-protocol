import {
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect
} from 'react'

import { sdk } from '@audius/sdk'
import type { AudiusSdk as AudiusSdkType, DecodedUserToken } from '@audius/sdk'

import { useAuth } from './AuthProvider'
import { useEnvVars } from './EnvVarsProvider'

type OAuthEnv = 'production' | 'staging'

type AudiusSdkContextType = {
  audiusSdk: AudiusSdkType | null
  oauthError: string
  isLoading: boolean
}

const AudiusSdkContext = createContext<AudiusSdkContextType>({
  audiusSdk: null,
  oauthError: '',
  isLoading: true
})

export const AudiusSdkProvider = ({ children }: { children: ReactNode }) => {
  const [audiusSdk, setAudiusSdk] = useState<AudiusSdkType | null>(null)
  const [oauthError, setOauthError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const envVars = useEnvVars()
  const { login, logout } = useAuth()
  const envMap: Record<
    string,
    'production' | 'staging' | 'development' | undefined
  > = {
    production: 'production',
    staging: 'staging',
    development: 'development'
  } as const
  const environment = envMap[envVars.env ?? 'production'] ?? 'production'

  const initSdk = async () => {
    if (audiusSdk) {
      return
    }
    // Get keys
    if (!envVars.ddexKey) {
      setIsLoading(false)
      console.error(`Skipping sdk initialization: ddexKey missing from env`)
      return
    }

    const sdkInst = sdk({
      apiKey: envVars.ddexKey,
      appName: 'DDEX Demo',
      environment
    })

    let env: OAuthEnv = 'production'
    if (environment === 'staging') {
      env = 'staging'
    }
    sdkInst.oauth!.init({
      env,
      successCallback: (_: DecodedUserToken, encodedJwt: string) => {
        setOauthError('')
        logout()
        login(encodedJwt)
      },
      errorCallback: (error) => {
        setOauthError(error)
      }
    })
    setAudiusSdk(sdkInst as AudiusSdkType)

    setIsLoading(false)
  }

  useEffect(() => {
    initSdk()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envVars])

  const contextValue = {
    audiusSdk,
    oauthError,
    isLoading
  }
  return (
    <AudiusSdkContext.Provider value={contextValue}>
      {children}
    </AudiusSdkContext.Provider>
  )
}

export const useAudiusSdk = () => useContext(AudiusSdkContext)
