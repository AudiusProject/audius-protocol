import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import {
  expect,
  it,
  describe,
  beforeAll,
  afterAll,
  afterEach,
  vitest
} from 'vitest'

import type { HealthCheckResponseData } from '../DiscoveryNodeSelector/healthCheckTypes'
import { Logger } from '../Logger'

import { StorageNodeSelector } from './StorageNodeSelector'

const storageNodeA = {
  endpoint: 'https://node-a.audius.co',
  delegateOwnerWallet: '0xc0ffee254729296a45a3885639AC7E10F9d54971'
}
const storageNodeB = {
  endpoint: 'https://node-b.audius.co',
  delegateOwnerWallet: '0xc0ffee254729296a45a3885639AC7E10F9d54972'
}

const discoveryNode = 'https://discovery-provider.audius.co'

const logger = new Logger()

const mswHandlers = [
  http.get(`${discoveryNode}/health_check`, () => {
    const data: HealthCheckResponseData = {
      service: 'discovery-node',
      version: '1.2.3',
      block_difference: 0,
      network: {
        discovery_nodes_with_owner: [
          { endpoint: discoveryNode, delegateOwnerWallet: '', ownerWallet: '' }
        ],
        content_nodes: [storageNodeA, storageNodeB]
      }
    }

    return HttpResponse.json({
      data,
      comms: { healthy: true }
    })
  }),

  http.get(`${storageNodeA.endpoint}/health_check`, () => {
    return HttpResponse.json({ data: { diskHasSpace: true } })
  }),

  http.get(`${storageNodeB.endpoint}/health_check`, () => {
    return HttpResponse.json({ data: { diskHasSpace: true } })
  })
]

const server = setupServer(...mswHandlers)

describe('StorageNodeSelector', () => {
  beforeAll(() => {
    server.listen()
    vitest.spyOn(console, 'warn').mockImplementation(() => {})
    vitest.spyOn(console, 'info').mockImplementation(() => {})
    vitest.spyOn(console, 'debug').mockImplementation(() => {})
    vitest.spyOn(console, 'error').mockImplementation(() => {})
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
      logger,
      endpoint: discoveryNode
    })

    const nodes = storageNodeSelector.getNodes('test')
    expect(nodes[0]!).toEqual(storageNodeA.endpoint)
  })

  it('selects the first healthy node', async () => {
    server.use(
      http.get(`${storageNodeA.endpoint}/health_check`, () => {
        return new HttpResponse(null, { status: 400 })
      })
    )
    const bootstrapNodes = [storageNodeA, storageNodeB]

    const storageNodeSelector = new StorageNodeSelector({
      bootstrapNodes,
      logger,
      endpoint: discoveryNode
    })

    expect(await storageNodeSelector.getSelectedNode()).toEqual(
      storageNodeB.endpoint
    )
  })

  it('selects correct nodes when provided a cid', async () => {
    const bootstrapNodes = [storageNodeA, storageNodeB]
    const cid = 'QmNnuRwRWxrbWwE9ib9dvWVr4hLgcHGAJ8euys8WH5NgCX'

    const storageNodeSelector = new StorageNodeSelector({
      bootstrapNodes,
      logger,
      endpoint: discoveryNode
    })

    expect(await storageNodeSelector.getNodes(cid)).toEqual([
      storageNodeB.endpoint,
      storageNodeA.endpoint
    ])
  })

  it('tries selecting all nodes', async () => {
    server.use(
      http.get(`${storageNodeA.endpoint}/health_check`, () => {
        return new HttpResponse(null, { status: 400 })
      })
    )
    server.use(
      http.get(`${storageNodeB.endpoint}/health_check`, () => {
        return new HttpResponse(null, { status: 400 })
      })
    )
    const bootstrapNodes = [storageNodeA, storageNodeB]

    const storageNodeSelector = new StorageNodeSelector({
      bootstrapNodes,
      logger,
      endpoint: discoveryNode
    })

    expect(await storageNodeSelector.getSelectedNode()).toBe(null)
    expect(await storageNodeSelector.triedSelectingAllNodes()).toBe(true)
  })
})
