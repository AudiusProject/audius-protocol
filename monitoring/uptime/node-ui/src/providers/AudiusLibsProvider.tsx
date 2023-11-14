import type { Web3 as Web3Type } from 'web3'
import type { AudiusLibs as AudiusLibsType } from '@audius/sdk/dist/WebAudiusLibs.d.ts'
import {
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect
} from 'react'
import { useEnvVars } from '../providers/EnvVarsProvider'

type AudiusLibsContextType = {
  web3: Web3Type | null
  audiusLibs: AudiusLibsType | null
  isLoading: boolean
}
const AudiusLibsContext = createContext<AudiusLibsContextType>({
  web3: null,
  audiusLibs: null,
  isLoading: true
})

export const AudiusLibsProvider = ({ children }: { children: ReactNode }) => {
  // const [web3, setWeb3] = useState(null)
  const [audiusLibs, setAudiusLibs] = useState<AudiusLibsType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const envVars = useEnvVars()
  const {
    env,

    // ethNetworkId,
    ethTokenAddress,
    ethRegistryAddress,
    ethProviderUrl,
    ethOwnerWallet,

    // entityManagerAddress,

    identityServiceEndpoint,

    wormholeContractAddress,
    claimDistributionContractAddress,
    solanaClusterEndpoint,
    wAudioMintAddress,
    usdcMintAddress,
    solanaTokenProgramAddress,
    claimableTokenPda,
    solanaFeePayerAddress,
    claimableTokenProgramAddress,
    rewardsManagerProgramId,
    rewardsManagerProgramPda,
    rewardsManagerTokenPda
  } = envVars

  const initLibraries = async () => {
    // Dynamically import hefty libraries so that we don't have to include them in the main index bundle
    // const { default: Web3 } = (await import('web3'))
    const audiusSdkModule = await import('@audius/sdk/dist/web-libs.js')
    const AudiusLibs = audiusSdkModule.libs as unknown as typeof AudiusLibsType
    // const Utils = audiusSdkModule.Utils

    // Configure Audius libs in read-only mode if there's no MetaMask in the browser

    const ethWeb3Config = AudiusLibs.configEthWeb3(
      ethTokenAddress,
      ethRegistryAddress,
      ethProviderUrl,
      ethOwnerWallet,
      claimDistributionContractAddress,
      wormholeContractAddress
    )

    const solanaWeb3Config = AudiusLibs.configSolanaWeb3({
      claimableTokenPDA: claimableTokenPda,
      solanaClusterEndpoint: solanaClusterEndpoint,
      mintAddress: wAudioMintAddress,
      usdcMintAddress: usdcMintAddress,
      solanaTokenAddress: solanaTokenProgramAddress,
      // @ts-expect-error ts(2322) Type 'string' is not assignable to type 'PublicKey'. This happens because libs has a bug where it sets the wrong type.
      feePayerAddress: solanaFeePayerAddress,
      claimableTokenProgramAddress,
      rewardsManagerProgramId,
      rewardsManagerProgramPDA: rewardsManagerProgramPda,
      rewardsManagerTokenPDA: rewardsManagerTokenPda,
      useRelay: true
    })

    const identityServiceConfig = {
      url: identityServiceEndpoint
    }

    const audiusLibsConfig = {
      ethWeb3Config,
      solanaWeb3Config,
      identityServiceConfig,
      discoveryProviderConfig: {},
      isServer: false,
      isDebug: env === 'staging' || env === 'development'
    }

    // @ts-expect-error ts(2345). It's complaining about not passing all the config args, but they're optional so we can ignore
    const audiusLibs = new AudiusLibs(audiusLibsConfig)
    await audiusLibs.init()

    // TODO: Configure libs differently if MetaMask is present

    // setWeb3(web3Instance)
    setAudiusLibs(audiusLibs)
    // @ts-expect-error ts(2741). This is only here for debugging and should eventually be removed
    window.audiusLibs = audiusLibs
    setIsLoading(false)
  }

  useEffect(() => {
    if (ethProviderUrl) {
      void initLibraries()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envVars])

  const contextValue = { web3: {} as Web3Type, audiusLibs, isLoading } // TODO: Probably return web3 as well
  return (
    <AudiusLibsContext.Provider value={contextValue}>
      {children}
    </AudiusLibsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAudiusLibs = () => useContext(AudiusLibsContext)
