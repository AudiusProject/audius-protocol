import { promises } from 'fs'
import path from 'path'

import { EthContracts } from '../../services/ethContracts'
import { EthWeb3Manager } from '../../services/ethWeb3Manager'
import { IdentityService } from '../../services/identity'
import type { ServicesConfig } from '../config/types'

const { writeFile } = promises

type EnvironmentConfig = {
  CLAIM_DISTRIBUTION_CONTRACT_ADDRESS: string
  ETH_OWNER_WALLET: string
  ETH_PROVIDER_URL: string
  ETH_REGISTRY_ADDRESS: string
  ETH_TOKEN_ADDRESS: string
  IDENTITY_SERVICE_URL: string
  WORMHOLE_ADDRESS: string
  ENTITY_MANAGER_CONTRACT_ADDRESS: string
  WEB3_PROVIDER_URL: string
  AAO_ENDPOINTS: string[]
}

const envConfigs: Record<'staging' | 'production', EnvironmentConfig> = {
  production: {
    CLAIM_DISTRIBUTION_CONTRACT_ADDRESS:
      '0x683c19E621A0F107a291fdAB38f80179809d61B5',
    ETH_OWNER_WALLET: '0xC7310a03e930DD659E15305ed7e1F5Df0F0426C5',
    ETH_PROVIDER_URL: 'https://eth.audius.co',
    ETH_REGISTRY_ADDRESS: '0xd976d3b4f4e22a238c1A736b6612D22f17b6f64C',
    ETH_TOKEN_ADDRESS: '0x18aAA7115705e8be94bfFEBDE57Af9BFc265B998',
    IDENTITY_SERVICE_URL: 'https://identityservice.audius.co',
    WORMHOLE_ADDRESS: '0x6E7a1F7339bbB62b23D44797b63e4258d283E095',
    WEB3_PROVIDER_URL: 'https://poa-gateway.audius.co',
    ENTITY_MANAGER_CONTRACT_ADDRESS:
      '0x1Cd8a543596D499B9b6E7a6eC15ECd2B7857Fd64',
    AAO_ENDPOINTS: [
      'https://antiabuseoracle.audius.co',
      'https://audius-oracle.creatorseed.com',
      'https://oracle.audius.endl.net'
    ]
  },
  staging: {
    CLAIM_DISTRIBUTION_CONTRACT_ADDRESS:
      '0x74b89B916c97d50557E8F944F32662fE52Ce378d',
    ETH_OWNER_WALLET: '',
    ETH_PROVIDER_URL: 'https://eth.staging.audius.co',
    ETH_REGISTRY_ADDRESS: '0xF27A9c44d7d5DDdA29bC1eeaD94718EeAC1775e3',
    ETH_TOKEN_ADDRESS: '0x5375BE4c52fA29b26077B0F15ee5254D779676A6',
    IDENTITY_SERVICE_URL: 'https://identityservice.staging.audius.co',
    WORMHOLE_ADDRESS: '0xf6f45e4d836da1d4ecd43bb1074620bfb0b7e0d7',
    WEB3_PROVIDER_URL: 'https://poa-gateway.staging.audius.co',
    ENTITY_MANAGER_CONTRACT_ADDRESS:
      '0x1Cd8a543596D499B9b6E7a6eC15ECd2B7857Fd64',
    AAO_ENDPOINTS: ['https://antiabuseoracle.staging.audius.co']
  }
}

const devConfig: ServicesConfig = {
  minVersion: '0.0.0',
  discoveryNodes: [
    {
      delegateOwnerWallet:
        '0xd09ba371c359f10f22ccda12fd26c598c7921bda3220c9942174562bc6a36fe8',
      endpoint: 'http://audius-protocol-discovery-provider-1'
    }
  ],
  storageNodes: [
    {
      delegateOwnerWallet: '0x0D38e653eC28bdea5A2296fD5940aaB2D0B8875c',
      endpoint: 'http://audius-protocol-creator-node-1'
    }
  ],
  entityManagerContractAddress: '0x254dffcd3277C0b1660F6d42EFbB754edaBAbC2B',
  web3ProviderUrl: 'http://audius-protocol-poa-ganache-1',
  identityServiceUrl: 'http://audius-protocol-identity-service-1',
  antiAbuseOracleNodes: {
    endpoints: ['http://audius-protocol-anti-abuse-oracle-1:8000'],
    registeredAddresses: ['0xF0D5BC18421fa04D0a2A2ef540ba5A9f04014BE3']
  }
}

const generateServicesConfig = async (
  config: EnvironmentConfig
): Promise<ServicesConfig> => {
  const contracts = new EthContracts({
    ethWeb3Manager: new EthWeb3Manager({
      identityService: new IdentityService({
        identityServiceEndpoint: config.IDENTITY_SERVICE_URL
      }),
      web3Config: {
        ownerWallet: config.ETH_OWNER_WALLET,
        providers: [config.ETH_PROVIDER_URL],
        tokenAddress: config.ETH_TOKEN_ADDRESS,
        registryAddress: config.ETH_REGISTRY_ADDRESS,
        claimDistributionContractAddress:
          config.CLAIM_DISTRIBUTION_CONTRACT_ADDRESS,
        wormholeContractAddress: config.WORMHOLE_ADDRESS
      }
    }),
    tokenContractAddress: config.ETH_TOKEN_ADDRESS,
    registryAddress: config.ETH_REGISTRY_ADDRESS,
    claimDistributionContractAddress:
      config.CLAIM_DISTRIBUTION_CONTRACT_ADDRESS,
    wormholeContractAddress: config.WORMHOLE_ADDRESS
  })

  const discoveryNodes =
    await contracts.ServiceProviderFactoryClient.getServiceProviderList(
      'discovery-node'
    )
  if (!discoveryNodes || discoveryNodes.length === 0) {
    throw Error('Discovery node services not found')
  }

  const storageNodes =
    await contracts.ServiceProviderFactoryClient.getServiceProviderList(
      'content-node'
    )
  if (!storageNodes || storageNodes.length === 0) {
    throw Error('Storage node services not found')
  }

  const antiAbuseAddresses =
    await contracts.EthRewardsManagerClient.getAntiAbuseOracleAddresses()
  if (!antiAbuseAddresses || antiAbuseAddresses.length === 0) {
    throw Error('Anti Abuse node services not found')
  }
  const antiAbuseOracleNodes = {
    endpoints: config.AAO_ENDPOINTS,
    registeredAddresses: antiAbuseAddresses
  }

  const minVersion = await contracts.getCurrentVersion('discovery-node')
  return {
    minVersion,
    discoveryNodes: discoveryNodes.map(({ endpoint, delegateOwnerWallet }) => ({
      endpoint,
      delegateOwnerWallet
    })),
    storageNodes: storageNodes.map(({ endpoint, delegateOwnerWallet }) => ({
      endpoint,
      delegateOwnerWallet
    })),
    antiAbuseOracleNodes,
    web3ProviderUrl: config.WEB3_PROVIDER_URL,
    entityManagerContractAddress: config.ENTITY_MANAGER_CONTRACT_ADDRESS,
    identityServiceUrl: config.IDENTITY_SERVICE_URL
  }
}

const writeServicesConfig = async () => {
  const production = await generateServicesConfig(envConfigs.production)
  const staging = await generateServicesConfig(envConfigs.staging)
  const development = devConfig
  const config: Record<string, ServicesConfig> = {
    development,
    staging,
    production
  }
  for (const env of Object.keys(config)) {
    await writeFile(
      path.resolve(__dirname, `../config/${env}.ts`),
      `/*
 * This file is autogenerated by ./scripts/generateServicesConfig.ts.
 * DO NOT EDIT MANUALLY!
 */
/* eslint-disable prettier/prettier */
import type { ServicesConfig } from './types'
export const servicesConfig: ServicesConfig = ${JSON.stringify(
        config[env],
        undefined,
        2
      )}
`
    )
  }
}

writeServicesConfig()
