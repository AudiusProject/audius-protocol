import type { AudiusLibs as AudiusLibsType } from '@audius/sdk/dist/WebAudiusLibs.d.ts'
import { useAccount } from 'wagmi'
import {
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect
} from 'react'
import { useEnvVars } from '../providers/EnvVarsProvider'
import useWeb3Signer from '../hooks/useWeb3Signer'

// This should be import type { Web3 } from web3, but Audius libs forces us to use a version of web3 without this type
type Web3Type = any

type AudiusLibsContextType = {
  audiusLibs: AudiusLibsType | null
  isLoading: boolean
  isReadOnly: boolean // read-only means the user can't approve transactions (i.e., no external wallet connected)
}
const AudiusLibsContext = createContext<AudiusLibsContextType>({
  audiusLibs: null,
  isLoading: true,
  isReadOnly: true
})

export const AudiusLibsProvider = ({ children }: { children: ReactNode }) => {
  const [audiusLibs, setAudiusLibs] = useState<AudiusLibsType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isReadOnly, setIsReadOnly] = useState(true)
  const { address } = useAccount()
  const envVars = useEnvVars()
  const connectedWeb3 = useWeb3Signer()

  // @ts-expect-error ts(2741). This is only here for debugging and should eventually be removed
  window.audiusLibs = audiusLibs

  // @ts-expect-error ts(2339) - should be removed eventually after debugging (fine for now)
  window.connectedWeb3 = connectedWeb3

  const initLibraries = async () => {
    if (address && connectedWeb3) {
      const audiusLibs = await initLibsWithAccount(
        envVars,
        address,
        connectedWeb3
      )
      setAudiusLibs(audiusLibs)
      setIsReadOnly(false)
    } else {
      const audiusLibs = await initLibsWithoutAccount(envVars)
      setAudiusLibs(audiusLibs)
      setIsReadOnly(true)
    }

    setIsLoading(false)
  }

  useEffect(() => {
    if (envVars.ethProviderUrl) {
      void initLibraries()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envVars, address, connectedWeb3])

  const contextValue = {
    audiusLibs,
    isLoading,
    isReadOnly
  }
  return (
    <AudiusLibsContext.Provider value={contextValue}>
      {children}
    </AudiusLibsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAudiusLibs = () => useContext(AudiusLibsContext)

// Returns an Audius libs instance that isn't connected to any wallet, so it can't approve transactions
const initLibsWithoutAccount = async (
  envVars: ReturnType<typeof useEnvVars>
): Promise<AudiusLibsType> => {
  // Dynamically import hefty libraries so that we don't have to include them in the main index bundle
  const audiusSdkModule = await import('@audius/sdk/dist/web-libs.js')
  const AudiusLibs = audiusSdkModule.libs as unknown as typeof AudiusLibsType

  const ethWeb3Config = AudiusLibs.configEthWeb3(
    envVars.ethTokenAddress,
    envVars.ethRegistryAddress,
    envVars.ethProviderUrl,
    envVars.ethOwnerWallet,
    envVars.claimDistributionContractAddress,
    envVars.wormholeContractAddress
  )

  const solanaWeb3Config = AudiusLibs.configSolanaWeb3({
    claimableTokenPDA: envVars.claimableTokenPda,
    solanaClusterEndpoint: envVars.solanaClusterEndpoint,
    mintAddress: envVars.wAudioMintAddress,
    usdcMintAddress: envVars.usdcMintAddress,
    solanaTokenAddress: envVars.solanaTokenProgramAddress,
    // @ts-expect-error ts(2322) Type 'string' is not assignable to type 'PublicKey'. This happens because libs has a bug where it sets the wrong type.
    feePayerAddress: envVars.solanaFeePayerAddress,
    claimableTokenProgramAddress: envVars.claimableTokenProgramAddress,
    rewardsManagerProgramId: envVars.rewardsManagerProgramId,
    rewardsManagerProgramPDA: envVars.rewardsManagerProgramPda,
    rewardsManagerTokenPDA: envVars.rewardsManagerTokenPda,
    useRelay: true
  })

  const identityServiceConfig = {
    url: envVars.identityServiceEndpoint
  }

  const audiusLibsConfig = {
    ethWeb3Config,
    solanaWeb3Config,
    identityServiceConfig,
    discoveryProviderConfig: {},
    isServer: false,
    isDebug: envVars.env === 'staging' || envVars.env === 'development'
  }

  // @ts-expect-error ts(2345). It's complaining about not passing all the config args, but they're optional so we can ignore
  const audiusLibs = new AudiusLibs(audiusLibsConfig)
  await audiusLibs.init()
  return audiusLibs
}

// Returns an Audius libs instance connected to the wallet in the browser (e.g., MetaMask), so it can approve transactions
const initLibsWithAccount = async (
  envVars: ReturnType<typeof useEnvVars>,
  ownerWallet: string,
  connectedWeb3: Web3Type
): Promise<AudiusLibsType> => {
  // Dynamically import hefty libraries so that we don't have to include them in the main index bundle
  const audiusSdkModule = await import('@audius/sdk/dist/web-libs.js')
  const AudiusLibs = audiusSdkModule.libs as unknown as typeof AudiusLibsType

  const web3Config = {
    registryAddress: envVars.ethRegistryAddress,
    entityManagerAddress: envVars.entityManagerAddress,
    useExternalWeb3: true,
    externalWeb3Config: {
      web3: connectedWeb3,
      ownerWallet
    }
  }

  const ethWeb3Config = {
    tokenAddress: envVars.ethTokenAddress,
    registryAddress: envVars.ethRegistryAddress,
    // Set it in read-only mode first instead of passing `connectedWeb3` here.
    // connectedWeb3 isn't compatible to pass here because libs is only setup to work with Metamask's window.ethereum
    providers: envVars.ethProviderUrl,
    ownerWallet,
    claimDistributionContractAddress: envVars.claimDistributionContractAddress,
    wormholeContractAddress: envVars.wormholeContractAddress
  }

  const solanaWeb3Config = AudiusLibs.configSolanaWeb3({
    claimableTokenPDA: envVars.claimableTokenPda,
    solanaClusterEndpoint: envVars.solanaClusterEndpoint,
    mintAddress: envVars.wAudioMintAddress,
    usdcMintAddress: envVars.usdcMintAddress,
    solanaTokenAddress: envVars.solanaTokenProgramAddress,
    // @ts-expect-error ts(2322) Type 'string' is not assignable to type 'PublicKey'. This happens because libs has a bug where it sets the wrong type.
    feePayerAddress: envVars.solanaFeePayerAddress,
    claimableTokenProgramAddress: envVars.claimableTokenProgramAddress,
    rewardsManagerProgramId: envVars.rewardsManagerProgramId,
    rewardsManagerProgramPDA: envVars.rewardsManagerProgramPda,
    rewardsManagerTokenPDA: envVars.rewardsManagerTokenPda,
    useRelay: true
  })

  const identityServiceConfig = {
    url: envVars.identityServiceEndpoint
  }

  const audiusLibsConfig = {
    web3Config,
    ethWeb3Config,
    solanaWeb3Config,
    identityServiceConfig,
    discoveryProviderConfig: {},
    isServer: false,
    isDebug: envVars.env === 'staging' || envVars.env === 'development'
  }

  // @ts-expect-error ts(2345). It's complaining about not passing all the config args, but they're optional so we can ignore
  const audiusLibs = new AudiusLibs(audiusLibsConfig)
  await audiusLibs.init()

  // Set audiusLibs to use our own connectedWeb3 instead of using the one that libs creates
  // because it isn't compatible with external wallets outside of directly using Metamask's window.ethereum
  if (audiusLibs.ethWeb3Manager) {
    audiusLibs.ethWeb3Manager.web3 = connectedWeb3
  }

  return audiusLibs
}
