import {
  BytesLike,
  Contract,
  JsonRpcProvider,
  WebSocketProvider,
  ZeroAddress,
  ethers,
} from 'ethers'
import {
  RegistryAbi,
  ServiceProviderFactoryAbi,
  ServiceTypeManagerAbi,
} from './abis'
import { SP } from '../useServiceProviders'

/** random utilities */
const utf8ToHex = (s: string): BytesLike => {
  return ethers.encodeBytes32String(s)
}

const hexToUtf8 = (s: BytesLike): string => {
  return ethers.decodeBytes32String(s)
}

const isAcceptedServiceType = (b: BytesLike): boolean => {
  const s = hexToUtf8(b)
  const acceptedTypes = ['content-node', 'discovery-node']
  return acceptedTypes.includes(s)
}

const isStaging = (env: string): boolean => {
  return env === 'staging'
}

/** contract keys */
const RegistryKey = utf8ToHex('Registry')
const GovernanceKey = utf8ToHex('Governance')
const StakingKey = utf8ToHex('StakingProxy')
const ServiceProviderFactoryKey = utf8ToHex('ServiceProviderFactory')
const ClaimsManagerKey = utf8ToHex('ClaimsManagerProxy')
const DelegateManagerKey = utf8ToHex('DelegateManager')
const AudiusTokenKey = utf8ToHex('Token')
const RewardsManagerKey = utf8ToHex('EthRewardsManagerProxy')
const WormholeKey = utf8ToHex('WormholeClientProxy')
const TrustedNotifierKey = utf8ToHex('TrustedNotifierManagerProxy')

const ProdProvider = new WebSocketProvider(
  'wss://eth-mainnet.g.alchemy.com/v2/W--Uss7AqotdfKao0PH6aTQa9bOG4osc'
)
const StageProvider = new WebSocketProvider(
  'wss://eth-goerli.g.alchemy.com/v2/P_3blSvCiVoh6e563dEWbpyAsRdIYLd3'
)

// `${env}-${type}` => SPs
const spCache: Map<string, SP[]> = new Map()

export const getRegisteredNodes = async (
  env: string,
  nodeType: string
): Promise<SP[]> => {
  const type = `${nodeType}-node`

  const cacheKey = `${env}-${type}`
  const cached = spCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const provider = isStaging(env) ? StageProvider : ProdProvider

  const initialRegistryAddress = isStaging(env)
    ? '0xF27A9c44d7d5DDdA29bC1eeaD94718EeAC1775e3'
    : '0xd976d3b4f4e22a238c1A736b6612D22f17b6f64C'

  const registry = new Contract(initialRegistryAddress, RegistryAbi, provider)

  const registryAddress: string = await registry.getContract(RegistryKey)
  if (registryAddress !== initialRegistryAddress) {
    throw new Error(
      `Retrieved registry address ${registryAddress} does not match given address ${provider}`
    )
  }

  const governanceAddress = await registry.getContract(GovernanceKey)
  const stakingProxyAddress = await registry.getContract(StakingKey)
  const serviceProviderFactoryAddress = await registry.getContract(
    ServiceProviderFactoryKey
  )
  const claimsManagerProxyAddress = await registry.getContract(ClaimsManagerKey)
  const delegateManagerAddress = await registry.getContract(DelegateManagerKey)
  const audiusTokenAddress = await registry.getContract(AudiusTokenKey)
  const rewardsManagerProxyAddress = await registry.getContract(
    RewardsManagerKey
  )
  const wormholeClientProxyAddress = await registry.getContract(WormholeKey)
  const trustedNotifierManagerProxyAddress = await registry.getContract(
    TrustedNotifierKey
  )

  const addresses = {
    governanceAddress,
    registryAddress,
    stakingProxyAddress,
    serviceProviderFactoryAddress,
    claimsManagerProxyAddress,
    delegateManagerAddress,
    audiusTokenAddress,
    rewardsManagerProxyAddress,
    wormholeClientProxyAddress,
    trustedNotifierManagerProxyAddress,
  }

  const serviceProviderFactory = new Contract(
    serviceProviderFactoryAddress,
    ServiceProviderFactoryAbi,
    provider
  )
  const serviceTypeManagerAddress =
    await serviceProviderFactory.getServiceTypeManagerAddress()

  const serviceTypeManager = new Contract(
    serviceTypeManagerAddress,
    ServiceTypeManagerAbi,
    provider
  )
  const serviceTypes = await serviceTypeManager.getValidServiceTypes()

  const sps: SP[] = []

  for (const serviceType of serviceTypes) {
    if (!isAcceptedServiceType(serviceType)) continue
    if (type !== hexToUtf8(serviceType)) continue
    const serviceProviderIds =
      await serviceProviderFactory.getTotalServiceTypeProviders(serviceType)
    for (let spid = BigInt(0); spid <= serviceProviderIds; spid++) {
      const {
        0: owner,
        1: endpoint,
        2: blockNumber,
        3: delegateOwnerWallet,
      } = await serviceProviderFactory.getServiceEndpointInfo(serviceType, spid)
      if (owner === ZeroAddress) continue
      sps.push({
        delegateOwnerWallet,
        endpoint,
        isRegistered: true,
        spID: spid,
        // @ts-ignore
        type,
        blockNumber,
      })
    }
  }

  spCache.set(cacheKey, sps)

  return sps
}

const hydrateCache = () => {
    getRegisteredNodes('staging', 'content')
    getRegisteredNodes('prod', 'content')
    getRegisteredNodes('staging', 'discovery')
    getRegisteredNodes('prod', 'discovery')
}

hydrateCache()
