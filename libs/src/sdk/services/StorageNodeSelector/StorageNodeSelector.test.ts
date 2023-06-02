import waitForExpect from 'wait-for-expect'
import { rest } from 'msw'
import { DiscoveryNodeSelector } from '../DiscoveryNodeSelector'
import { StorageNodeSelector } from './StorageNodeSelector'
import type { HealthCheckResponseData } from '../DiscoveryNodeSelector/healthCheckTypes'
import { setupServer } from 'msw/node'

import type { AuthService } from '../Auth/types'
import type { EIP712TypedData } from 'eth-sig-util'

const storageNodeA = {
  endpoint: 'https://node-a.audius.co',
  ownerDelegateWallet: '0xc0ffee254729296a45a3885639AC7E10F9d54971'
}
const storageNodeB = {
  endpoint: 'https://node-b.audius.co',
  ownerDelegateWallet: '0xc0ffee254729296a45a3885639AC7E10F9d54972'
}

const userWallet = '0xc0ffee254729296a45a3885639AC7E10F9d54979'

const discoveryNode = 'https://discovery-provider.audius.co'

class MockAuth implements AuthService {
  getSharedSecret = async () => new Uint8Array()
  signTransaction: (data: EIP712TypedData) => Promise<string> = async () => ''
  sign: (data: string) => Promise<[Uint8Array, number]> = async () => [
    new Uint8Array(),
    0
  ]
  getAddress = async () => {
    return userWallet
  }
}

// class MockDiscoveryNodeSelector implements DiscoveryNodeSelectorService {
//   callbacks?: Array<(endpoint: string) => void>

//   async getSelectedEndpoint() {
//     return discoveryNode
//   }
//   createMiddleware() {
//     return {
//       pre: async () => {},
//       post: async () => {},
//       onError: async () => {}
//     }
//   }
//   addEventListener(event: string, callback: (endpoint: string) => void) {
//     this.callbacks?.push(callback)
//   }
// }

const auth = new MockAuth()

const mswHandlers = [
  rest.get(`${discoveryNode}/health_check`, (_req, res, ctx) => {
    const data: HealthCheckResponseData = {
      service: 'discovery-node',
      version: '1.2.3',
      block_difference: 0,
      network: {
        discovery_nodes: [discoveryNode],
        content_nodes: [storageNodeA, storageNodeB]
      }
    }

    return res(
      ctx.status(200),
      ctx.json({
        data,
        comms: { healthy: true }
      })
    )
  }),

  rest.get(`${storageNodeA.endpoint}/status`, (_req, res, ctx) => {
    return res(ctx.status(200))
  }),

  rest.get(`${storageNodeB.endpoint}/status`, (_req, res, ctx) => {
    return res(ctx.status(200))
  })
]

const server = setupServer(...mswHandlers)

describe('StorageNodeSelector', () => {
  beforeAll(() => {
    server.listen()
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'info').mockImplementation(() => {})
    jest.spyOn(console, 'debug').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  it('selects the correct endpoint given bootstrap nodes and user wallet', async () => {
    const bootstrapNodes = [storageNodeA, storageNodeB]

    const storageNodeSelector = new StorageNodeSelector({
      bootstrapNodes,
      auth
    })

    expect(await storageNodeSelector.getSelectedNode()).toEqual(
      storageNodeA.endpoint
    )
  })

  it('selects the first healthy node', async () => {
    server.use(
      rest.get(`${storageNodeA.endpoint}/status`, (_req, res, ctx) => {
        return res(ctx.status(400))
      })
    )
    const bootstrapNodes = [storageNodeA, storageNodeB]

    const storageNodeSelector = new StorageNodeSelector({
      bootstrapNodes,
      auth
    })

    expect(await storageNodeSelector.getSelectedNode()).toEqual(
      storageNodeB.endpoint
    )
  })

  it('selects correct storage node when discovery node is selected', async () => {
    const bootstrapDiscoveryNodes = [discoveryNode]
    const discoveryNodeSelector = new DiscoveryNodeSelector({
      healthCheckThresholds: {
        minVersion: '1.2.3'
      },
      bootstrapServices: bootstrapDiscoveryNodes
    })

    const storageNodeSelector = new StorageNodeSelector({
      discoveryNodeSelector,
      auth
    })

    const discoveryNodeEndpoint =
      await discoveryNodeSelector.getSelectedEndpoint()

    expect(discoveryNodeEndpoint).toBe(discoveryNode)

    await waitForExpect(async () => {
      expect(await storageNodeSelector.getSelectedNode()).toEqual(
        storageNodeA.endpoint
      )
    })
  })
})
