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
} from '@audius/sdk/dist/sdk/index.d.ts'
import Hashids from 'hashids'

import { FeatureFlags } from '../utils/constants'

import { useEnvVars } from './EnvVarsProvider'
import { useRemoteConfig } from './RemoteConfigProvider'

const HASH_SALT = 'azowernasdfoia'
const MIN_LENGTH = 5
const hashids = new Hashids(HASH_SALT, MIN_LENGTH)

type OAuthEnv = 'production' | 'staging'

type AudiusSdkContextType = {
  audiusSdk: AudiusSdkType | null
  currentUser: DecodedUserToken | null
  isAdmin: boolean
  oauthError: string
  isLoading: boolean
}

const AudiusSdkContext = createContext<AudiusSdkContextType>({
  audiusSdk: null,
  currentUser: null,
  isAdmin: false,
  oauthError: '',
  isLoading: true
})

export const AudiusSdkProvider = ({ children }: { children: ReactNode }) => {
  const [audiusSdk, setAudiusSdk] = useState<AudiusSdkType | null>(null)
  const [currentUser, setCurrentUser] = useState<DecodedUserToken | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [oauthError, setOauthError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const envVars = useEnvVars()
  const { didInit, getFeatureEnabled } = useRemoteConfig()

  // @ts-expect-error ts(2741). This is only here for debugging and should eventually be removed
  window.audiusSdk = audiusSdk

  /**
   * Decodes a string id into an int. Returns null if an invalid ID. */
  const decodeHashId = (id: string): number | null => {
    try {
      const ids = hashids.decode(id)
      if (!ids.length) return null
      const num = Number(ids[0])
      if (isNaN(num)) return null
      return num
    } catch (e) {
      setOauthError(`Failed to decode ${id}: ${e}`)
      return null
    }
  }

  const checkUserAllowlisted = (user: DecodedUserToken) => {
    const decodedUserId = decodeHashId(user.userId)
    if (decodedUserId) {
      const uploadsAllowed = getFeatureEnabled({
        flag: FeatureFlags.DDEX_UPLOADS,
        userId: decodedUserId
      })
      const ddexAdmin = getFeatureEnabled({
        flag: FeatureFlags.DDEX_ADMIN,
        userId: decodedUserId
      })
      if (!uploadsAllowed && !ddexAdmin) {
        alert('401: User not authorized for DDEX')
      } else {
        setCurrentUser(user)
        setIsAdmin(ddexAdmin)
      }
    }
  }

  const initSdk = () => {
    if (!window.Web3 || !didInit) {
      return
    }

    if (!audiusSdk) {
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
        successCallback: (user: DecodedUserToken) => {
          setOauthError('')
          checkUserAllowlisted(user)
        },
        errorCallback: (error) => {
          setOauthError(error)
        }
      })
      setAudiusSdk(sdkInst as AudiusSdkType)
    }

    setIsLoading(false)
  }

  useEffect(() => {
    initSdk()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [didInit])

  const contextValue = {
    audiusSdk,
    currentUser,
    isAdmin,
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
