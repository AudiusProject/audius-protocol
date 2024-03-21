import {
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect
} from 'react'

import {
  DiscoveryNodeSelector,
  EntityManager,
  Logger,
  StorageNodeSelector,
  developmentConfig,
  stagingConfig,
  productionConfig,
  sdk,
  DefaultAuth
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

  const initSdk = async () => {
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
    } else {
      let useStaging = true
      try {
        const response = await fetch(`${initialSelectedNode}/health_check`)
        if (response.ok) {
          useStaging = false
        }
      } catch (_) {
        /* ignored */
      }
      if (useStaging) {
        console.warn(
          'Falling back to staging config in dev environment because dev Discovery Node is down'
        )
        config = stagingConfig as ServicesConfig
        initialSelectedNode = 'https://discoveryprovider.staging.audius.co'
      }
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
      auth: new DefaultAuth(envVars.ddexKey),
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
    if (
      envVars.env === 'stage' ||
      initialSelectedNode === 'https://discoveryprovider.staging.audius.co'
    ) {
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
