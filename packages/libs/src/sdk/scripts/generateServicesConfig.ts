import { promises } from 'fs'
import path from 'path'

import { EthContracts } from '../../services/ethContracts'
import { EthWeb3Manager } from '../../services/ethWeb3Manager'
import { IdentityService } from '../../services/identity'
import type { SdkServicesConfig } from '../config/types'

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
    ETH_REGISTRY_ADDRESS: '0xc682C2166E11690B64338e11633Cb8Bb60B0D9c0',
    ETH_TOKEN_ADDRESS: '0x1376180Ee935AA64A27780F4BE97726Df7B0e2B2',
    IDENTITY_SERVICE_URL: 'https://identityservice.staging.audius.co',
    WORMHOLE_ADDRESS: '0xf6f45e4d836da1d4ecd43bb1074620bfb0b7e0d7',
    WEB3_PROVIDER_URL: 'https://poa-gateway.staging.audius.co',
    ENTITY_MANAGER_CONTRACT_ADDRESS:
      '0x1Cd8a543596D499B9b6E7a6eC15ECd2B7857Fd64',
    AAO_ENDPOINTS: ['https://antiabuseoracle.staging.audius.co']
  }
}

const productionConfig: SdkServicesConfig = {
  network: {
    minVersion: '',
    discoveryNodes: [],
    storageNodes: [],
    antiAbuseOracleNodes: {
      endpoints: [
        'https://antiabuseoracle.audius.co',
        'https://audius-oracle.creatorseed.com',
        'https://oracle.audius.endl.net'
      ],
      registeredAddresses: []
    },
    identityService: 'https://identityservice.audius.co'
  },
  acdc: {
    entityManagerContractAddress: '0x1Cd8a543596D499B9b6E7a6eC15ECd2B7857Fd64',
    chainId: 31524
  },
  solana: {
    claimableTokensProgramAddress:
      'Ewkv3JahEFRKkcJmpoKB7pXbnUHwjAyXiwEo4ZY2rezQ',
    rewardManagerProgramAddress: 'DDZDcYdQFEMwcu2Mwo75yGFjJ1mUQyyXLWzhZLEVFcei',
    rewardManagerStateAddress: '71hWFVYokLaN1PNYzTAWi13EfJ7Xt9VbSWUKsXUT8mxE',
    paymentRouterProgramAddress: 'paytYpX3LPN98TAeen6bFFeraGSuWnomZmCXjAsoqPa',
    stakingBridgeProgramAddress: 'stkB5DZziVJT1C1VmzvDdRtdWxfs5nwcHViiaNBDK31',
    rpcEndpoint: 'https://audius-fe.rpcpool.com',
    usdcTokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    wAudioTokenMint: '9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM',
    rewardManagerLookupTableAddress:
      '4UQwpGupH66RgQrWRqmPM9Two6VJEE68VZ7GeqZ3mvVv'
  }
}

const stagingConfig: SdkServicesConfig = {
  network: {
    minVersion: '',
    discoveryNodes: [],
    storageNodes: [],
    antiAbuseOracleNodes: {
      endpoints: ['https://antiabuseoracle.staging.audius.co'],
      registeredAddresses: []
    },
    identityService: 'https://identityservice.staging.audius.co'
  },
  acdc: {
    entityManagerContractAddress: '0x1Cd8a543596D499B9b6E7a6eC15ECd2B7857Fd64',
    chainId: 1056801
  },
  solana: {
    claimableTokensProgramAddress:
      '2sjQNmUfkV6yKKi4dPR8gWRgtyma5aiymE3aXL2RAZww',
    rewardManagerProgramAddress: 'CDpzvz7DfgbF95jSSCHLX3ERkugyfgn9Fw8ypNZ1hfXp',
    rewardManagerStateAddress: 'GaiG9LDYHfZGqeNaoGRzFEnLiwUT7WiC6sA6FDJX9ZPq',
    paymentRouterProgramAddress: 'sp28KA2bTnTA4oSZ3r9tTSKfmiXZtZQHnYYQqWfUyVa',
    stakingBridgeProgramAddress: 'stkuyR7dTzxV1YnoDo5tfuBmkuKn7zDatimYRDTmQvj',
    rpcEndpoint: 'https://audius-fe.rpcpool.com',
    usdcTokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    wAudioTokenMint: 'BELGiMZQ34SDE6x2FUaML2UHDAgBLS64xvhXjX5tBBZo',
    rewardManagerLookupTableAddress:
      'ChFCWjeFxM6SRySTfT46zXn2K7m89TJsft4HWzEtkB4J'
  }
}

const developmentConfig: SdkServicesConfig = {
  network: {
    minVersion: '0.0.0',
    discoveryNodes: [
      {
        delegateOwnerWallet:
          '0xd09ba371c359f10f22ccda12fd26c598c7921bda3220c9942174562bc6a36fe8',
        endpoint: 'http://audius-protocol-discovery-provider-1',
        ownerWallet:
          '0xd09ba371c359f10f22ccda12fd26c598c7921bda3220c9942174562bc6a36fe8'
      }
    ],
    storageNodes: [
      {
        delegateOwnerWallet: '0x0D38e653eC28bdea5A2296fD5940aaB2D0B8875c',
        endpoint: 'http://audius-protocol-creator-node-1'
      }
    ],
    antiAbuseOracleNodes: {
      endpoints: ['http://audius-protocol-anti-abuse-oracle-1:8000'],
      registeredAddresses: ['0xF0D5BC18421fa04D0a2A2ef540ba5A9f04014BE3']
    },
    identityService: 'https://audius-protocol-identity-service-1'
  },
  acdc: {
    entityManagerContractAddress: '0x254dffcd3277C0b1660F6d42EFbB754edaBAbC2B',
    chainId: 1337
  },
  solana: {
    claimableTokensProgramAddress:
      'testHKV1B56fbvop4w6f2cTGEub9dRQ2Euta5VmqdX9',
    rewardManagerProgramAddress: 'testLsJKtyABc9UXJF8JWFKf1YH4LmqCWBC42c6akPb',
    rewardManagerStateAddress: 'DJPzVothq58SmkpRb1ATn5ddN2Rpv1j2TcGvM3XsHf1c',
    paymentRouterProgramAddress: 'apaySbqV1XAmuiGszeN4NyWrXkkMrnuJVoNhzmS1AMa',
    stakingBridgeProgramAddress: '',
    rpcEndpoint: 'http://audius-protocol-solana-test-validator-1',
    usdcTokenMint: '26Q7gP8UfkDzi7GMFEQxTJaNJ8D2ybCUjex58M5MLu8y',
    wAudioTokenMint: '37RCjhgV1qGV2Q54EHFScdxZ22ydRMdKMtVgod47fDP3',
    rewardManagerLookupTableAddress:
      'GNHKVSmHvoRBt1JJCxz7RSMfzDQGDGhGEjmhHyxb3K5J'
  }
}

const generateServicesConfig = async (
  env: EnvironmentConfig,
  config: SdkServicesConfig
): Promise<SdkServicesConfig> => {
  const contracts = new EthContracts({
    ethWeb3Manager: new EthWeb3Manager({
      identityService: new IdentityService({
        identityServiceEndpoint: env.IDENTITY_SERVICE_URL
      }),
      web3Config: {
        ownerWallet: env.ETH_OWNER_WALLET,
        providers: [env.ETH_PROVIDER_URL],
        tokenAddress: env.ETH_TOKEN_ADDRESS,
        registryAddress: env.ETH_REGISTRY_ADDRESS,
        claimDistributionContractAddress:
          env.CLAIM_DISTRIBUTION_CONTRACT_ADDRESS,
        wormholeContractAddress: env.WORMHOLE_ADDRESS
      }
    }),
    tokenContractAddress: env.ETH_TOKEN_ADDRESS,
    registryAddress: env.ETH_REGISTRY_ADDRESS,
    claimDistributionContractAddress: env.CLAIM_DISTRIBUTION_CONTRACT_ADDRESS,
    wormholeContractAddress: env.WORMHOLE_ADDRESS
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

  const minVersion = await contracts.getCurrentVersion('discovery-node')

  config.network.minVersion = minVersion
  config.network.discoveryNodes = discoveryNodes.map((n) => ({
    endpoint: n.endpoint,
    ownerWallet: n.owner,
    delegateOwnerWallet: n.delegateOwnerWallet
  }))
  config.network.storageNodes = storageNodes.map((n) => ({
    endpoint: n.endpoint,
    delegateOwnerWallet: n.delegateOwnerWallet
  }))
  config.network.antiAbuseOracleNodes.registeredAddresses = antiAbuseAddresses

  return config
}

const writeServicesConfig = async () => {
  const production = await generateServicesConfig(
    envConfigs.production,
    productionConfig
  )
  const staging = await generateServicesConfig(
    envConfigs.staging,
    stagingConfig
  )
  const development = developmentConfig
  const config: Record<string, SdkServicesConfig> = {
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
import type { SdkServicesConfig } from './types'
export const ${env}Config: SdkServicesConfig = ${JSON.stringify(
        config[env],
        undefined,
        2
      )}
`
    )
  }
}

writeServicesConfig()
