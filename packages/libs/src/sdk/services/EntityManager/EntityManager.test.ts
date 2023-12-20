import type { EIP712TypedData } from 'eth-sig-util'
import { rest } from 'msw'
import { setupServer } from 'msw/node'

import { developmentConfig } from '../../config'
import Web3 from '../../utils/web3'
import type { AuthService } from '../Auth/types'
import { DiscoveryNodeSelector } from '../DiscoveryNodeSelector'
import { Logger } from '../Logger'

import { EntityManager } from './EntityManager'
import { Action, EntityType } from './types'

const userWallet = '0xc0ffee254729296a45a3885639AC7E10F9d54979'

const discoveryNode = 'https://discovery-provider.audius.co'

jest.mock('../DiscoveryNodeSelector')
jest.mock('../../utils/web3', () => {
  return jest.fn().mockImplementation(() => {
    return {
      eth: {
        net: {
          getId: () => ''
        },
        Contract: jest.fn().mockImplementation(() => ({
          methods: {
            manageEntity: () => ({
              encodeABI: () => ''
            })
          }
        }))
      }
    }
  })
})
;(Web3 as any).providers = {
  HttpProvider: jest.fn().mockImplementation(() => {})
}

jest
  .spyOn(DiscoveryNodeSelector.prototype, 'getSelectedEndpoint')
  .mockImplementation(async () => discoveryNode)

class MockAuth implements AuthService {
  getSharedSecret = async () => new Uint8Array()

  signTransaction: (data: EIP712TypedData) => Promise<string> = async () =>
    '0xcfe7a6974bd1691c0a298e119318337c54bf58175f8a9a6aeeaf3b0346c6105265c83de64ab81da28266c4b5b4ff68d81d9e266f9163d7ebd5b2a52d46e275941c'

  sign: (data: string) => Promise<[Uint8Array, number]> = async () => [
    new Uint8Array(),
    0
  ]

  hashAndSign: (data: string) => Promise<string> = async () => ''

  getAddress = async () => {
    return userWallet
  }
}

const auth = new MockAuth()
const discoveryNodeSelector = new DiscoveryNodeSelector({
  initialSelectedNode: discoveryNode
})

const mswHandlers = [
  rest.post(
    `${developmentConfig.identityServiceUrl}/relay`,
    (_req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          receipt: {
            blockHash: '',
            blockNumber: 1
          }
        })
      )
    }
  ),

  rest.get(`${discoveryNode}/block_confirmation`, (req, res, ctx) => {
    const blockNumber = req.url.searchParams.get('blocknumber')

    const data = {
      0: {
        block_passed: false
      },
      1: {
        block_passed: true
      }
    }[Number(blockNumber)!]

    return res(
      ctx.status(200),
      ctx.json({
        data
      })
    )
  })
]

const server = setupServer(...mswHandlers)

const logger = new Logger()

const entityManager = new EntityManager({
  discoveryNodeSelector,
  web3ProviderUrl: '',
  contractAddress: developmentConfig.entityManagerContractAddress,
  identityServiceUrl: developmentConfig.identityServiceUrl,
  logger
})

describe('EntityManager', () => {
  beforeAll(() => {
    server.listen()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  describe('manageEntity', () => {
    it('calls relay and confirms the transaction', async () => {
      const confirmWriteSpy = jest.spyOn(entityManager, 'confirmWrite')

      await entityManager.manageEntity({
        userId: 1,
        entityType: EntityType.TRACK,
        entityId: 1,
        action: Action.CREATE,
        metadata: JSON.stringify({}),
        auth
      })

      expect(confirmWriteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          blockHash: '',
          blockNumber: 1
        })
      )
    })
  })

  describe('confirmWrite', () => {
    it('confirms a write', async () => {
      const result = await entityManager.confirmWrite({
        blockHash: '',
        blockNumber: 1
      })
      expect(result).toBe(true)
    })

    it("throws when a write can't be confirmed", async () => {
      await expect(async () => {
        await entityManager.confirmWrite({
          blockHash: '',
          blockNumber: 0,
          confirmationTimeout: 1000
        })
      }).rejects.toThrow()
    })
  })

  describe('manageEntityConfig', () => {
    it('relays to the correct service', async () => {
      const sharedDefaultConfig = {
        discoveryNodeSelector,
        web3ProviderUrl: '',
        contractAddress: developmentConfig.entityManagerContractAddress,
        identityServiceUrl: developmentConfig.identityServiceUrl,
        logger
      }

      const discoveryEntityManager = new EntityManager({
        ...sharedDefaultConfig,
        useDiscoveryRelay: true
      })

      const relayEntityManagerUndefined = new EntityManager({
        ...sharedDefaultConfig
      })

      const relayEntityManagerFalse = new EntityManager({
        ...sharedDefaultConfig,
        useDiscoveryRelay: false
      })

      const discoveryRelayUrl = await discoveryEntityManager.getRelayEndpoint()
      const identityRelayUrlUndefined =
        await relayEntityManagerUndefined.getRelayEndpoint()
      const identityRelayUrlFalse =
        await relayEntityManagerFalse.getRelayEndpoint()

      expect(discoveryRelayUrl).toEqual(discoveryNode)
      expect(identityRelayUrlUndefined).toEqual(
        developmentConfig.identityServiceUrl
      )
      expect(identityRelayUrlUndefined).toEqual(identityRelayUrlFalse)
    })
  })
})
