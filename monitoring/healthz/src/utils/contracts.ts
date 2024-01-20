import { BytesLike, Contract, JsonRpcProvider, ethers } from 'ethers'
import { RegistryAbi } from './abis'

/** ethers setup */
const SepoliaProvider = new JsonRpcProvider(
  'https://1rpc.io/sepolia'
)
const SepoliaRegistryAddress = '0xc682C2166E11690B64338e11633Cb8Bb60B0D9c0'

const utf8ToHex = (s: string): BytesLike => {
  return ethers.encodeBytes32String(s)
}

/** contract keys */
const RegistryKey = utf8ToHex("Registry")
const GovernanceKey = utf8ToHex("Governance")
const StakingKey = utf8ToHex("StakingProxy")
const ServiceProviderFactoryKey = utf8ToHex("ServiceProviderFactory")
const ClaimsManagerKey = utf8ToHex("ClaimsManagerProxy")
const DelegateManagerKey = utf8ToHex("DelegateManager")
const AudiusTokenKey = utf8ToHex("Token")
const RewardsManagerKey = utf8ToHex("EthRewardsManagerProxy")
const WormholeKey = utf8ToHex("WormholeClientProxy")
const TrustedNotifierKey = utf8ToHex("TrustedNotifierManagerProxy")

export const getAudiusContracts = async () => {
  const registry = new Contract(
    SepoliaRegistryAddress,
    RegistryAbi,
    SepoliaProvider
  )

  const registryAddress: string = await registry.getContract(RegistryKey)
  if (registryAddress !== SepoliaRegistryAddress) {
    throw new Error(`Retrieved registry address ${registryAddress} does not match given address ${SepoliaProvider}`)
  }

  const governanceAddress = await registry.getContract(GovernanceKey);
  const stakingProxyAddress = await registry.getContract(StakingKey);
  const serviceProviderFactoryAddress = await registry.getContract(ServiceProviderFactoryKey);
  const claimsManagerProxyAddress = await registry.getContract(ClaimsManagerKey);
  const delegateManagerAddress = await registry.getContract(DelegateManagerKey);
  const audiusTokenAddress = await registry.getContract(AudiusTokenKey);
  const rewardsManagerProxyAddress = await registry.getContract(RewardsManagerKey);
  const wormholeClientProxyAddress = await registry.getContract(WormholeKey);
  const trustedNotifierManagerProxyAddress = await registry.getContract(TrustedNotifierKey);


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
    trustedNotifierManagerProxyAddress
  }

  console.log(addresses)
}
