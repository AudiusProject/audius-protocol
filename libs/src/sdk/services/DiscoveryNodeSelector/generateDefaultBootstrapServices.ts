import { EthWeb3Manager } from '../../../services/ethWeb3Manager'
import { EthContracts } from '../../../services/ethContracts'
import { IdentityService } from '../../../services/identity'
import { writeFile } from 'fs/promises'
import path from 'path'

const CLAIM_DISTRIBUTION_CONTRACT_ADDRESS =
  '0x683c19E621A0F107a291fdAB38f80179809d61B5'
const ETH_OWNER_WALLET = '0xC7310a03e930DD659E15305ed7e1F5Df0F0426C5'
const ETH_PROVIDER_URL = 'https://eth.audius.co'
const ETH_REGISTRY_ADDRESS = '0xd976d3b4f4e22a238c1A736b6612D22f17b6f64C'
const ETH_TOKEN_ADDRESS = '0x18aAA7115705e8be94bfFEBDE57Af9BFc265B998'
const IDENTITY_SERVICE_ENDPOINT = 'https://identityservice.audius.co'
const WORMHOLE_ADDRESS = '0x6E7a1F7339bbB62b23D44797b63e4258d283E095'

const contracts = new EthContracts({
  ethWeb3Manager: new EthWeb3Manager({
    identityService: new IdentityService({
      identityServiceEndpoint: IDENTITY_SERVICE_ENDPOINT
    }),
    web3Config: {
      ownerWallet: ETH_OWNER_WALLET,
      providers: [ETH_PROVIDER_URL],
      tokenAddress: ETH_TOKEN_ADDRESS,
      registryAddress: ETH_REGISTRY_ADDRESS,
      claimDistributionContractAddress: CLAIM_DISTRIBUTION_CONTRACT_ADDRESS,
      wormholeContractAddress: WORMHOLE_ADDRESS
    }
  }),
  tokenContractAddress: ETH_TOKEN_ADDRESS,
  registryAddress: ETH_REGISTRY_ADDRESS,
  claimDistributionContractAddress: CLAIM_DISTRIBUTION_CONTRACT_ADDRESS,
  wormholeContractAddress: WORMHOLE_ADDRESS
})

const getDiscoveryNodes =
  contracts.ServiceProviderFactoryClient.getServiceProviderList(
    'discovery-node'
  )
getDiscoveryNodes.then(async (list) => {
  if (!list || list.length === 0) {
    throw Error('Services not found')
  }
  await writeFile(
    path.resolve(__dirname, 'defaultBootstrapServices.json'),
    JSON.stringify(
      {
        services: list.map((node) => node.endpoint)
      },
      undefined,
      2
    )
  )
})
