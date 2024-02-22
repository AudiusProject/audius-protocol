import {
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect
} from 'react'

import {
  AppAuth,
  DiscoveryNodeSelector,
  EntityManager,
  Logger,
  StorageNodeSelector,
  developmentConfig,
  stagingConfig,
  productionConfig,
  sdk
} from '@audius/sdk'
import type {
  AudiusSdk as AudiusSdkType,
  ServicesConfig,
  DecodedUserToken
} from '@audius/sdk'

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

  const initSdk = () => {
    if (audiusSdk) {
      return
    }

    const logger = new Logger({ logLevel: 'info' })

    // Determine config to use
    let config = developmentConfig as ServicesConfig
    let initialSelectedNode = 'http://audius-protocol-discovery-provider-1'
    if (envVars.env === 'prod') {
      config = productionConfig as ServicesConfig
      initialSelectedNode = 'https://discoveryprovider.audius.co'
    } else if (envVars.env === 'stage') {
      config = stagingConfig as ServicesConfig
      initialSelectedNode = 'https://discoveryprovider.staging.audius.co'
    }

    // Get keys
    if (!envVars.ddexKey) {
      setIsLoading(false)
      console.error(`Skipping sdk initialization: ddexKey missing from env`)
      return
    }

    // Init SDK
    const discoveryNodeSelector = new DiscoveryNodeSelector({
      initialSelectedNode
    })
    const storageNodeSelector = new StorageNodeSelector({
      auth: new AppAuth(envVars.ddexKey),
      discoveryNodeSelector,
      bootstrapNodes: config.storageNodes,
      logger
    })
    const sdkInst = sdk({
      services: {
        discoveryNodeSelector,
        entityManager: new EntityManager({
          discoveryNodeSelector,
          web3ProviderUrl: config.web3ProviderUrl,
          contractAddress: config.entityManagerContractAddress,
          identityServiceUrl: config.identityServiceUrl,
          useDiscoveryRelay: true,
          logger
        }),
        storageNodeSelector,
        logger
      },
      apiKey: envVars.ddexKey,
      appName: 'DDEX Demo'
    })

    let env: OAuthEnv = 'production'
    if (envVars.env === 'stage') {
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
