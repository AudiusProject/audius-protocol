import type { StorageNode } from './getNStorageNodes'
import assert from 'assert'
import nock from 'nock'
import { isNodeHealthy, getNStorageNodes } from './getNStorageNodes'

const sampleNodes: StorageNode[] = [
  {
    owner: 'owner1',
    endpoint: 'http://node1.com',
    spID: 1,
    type: 'content-node',
    blockNumber: 1,
    delegateOwnerWallet: 'wallet1'
  },
  {
    owner: 'owner2',
    endpoint: 'http://node2.com',
    spID: 2,
    type: 'content-node',
    blockNumber: 2,
    delegateOwnerWallet: 'wallet2'
  },
  {
    owner: 'owner3',
    endpoint: 'http://node3.com',
    spID: 3,
    type: 'content-node',
    blockNumber: 3,
    delegateOwnerWallet: 'wallet3'
  }
]

describe('isNodeHealthy', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('should return true when node is healthy', async () => {
    nock('http://node1.com').get('/status').reply(200)

    const result = await isNodeHealthy('http://node1.com')
    assert.equal(result, true)
  })

  it('should return false when node is not healthy', async () => {
    nock('http://node1.com').get('/status').reply(500)

    const result = await isNodeHealthy('http://node1.com')
    assert.equal(result, false)
  })

  it('should return false when an error occurs', async () => {
    nock('http://invalid-url').get('/status').replyWithError('Request failed')

    const result = await isNodeHealthy('http://invalid-url')
    assert.equal(result, false)
  })
})

describe('getNStorageNodes', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('should return healthy nodes when no rendezvousKey is provided', async () => {
    nock('http://node1.com').get('/status').reply(500)
    nock('http://node2.com').get('/status').reply(500)
    nock('http://node3.com').get('/status').reply(200)

    const result = await getNStorageNodes(sampleNodes, 2)
    assert.deepEqual(result, ['http://node3.com'])
  })

  it('should return all healthy nodes when no numNodes is not specified and all nodes are healthy', async () => {
    nock('http://node1.com').get('/status').reply(200)
    nock('http://node2.com').get('/status').reply(200)
    nock('http://node3.com').get('/status').reply(200)

    const result = await getNStorageNodes(sampleNodes)
    assert.deepEqual(result, [
      'http://node1.com',
      'http://node2.com',
      'http://node3.com'
    ])
  })

  it('should return all healthy nodes when no numNodes is not specified and 1 node is unhealthy', async () => {
    nock('http://node1.com').get('/status').reply(200)
    nock('http://node2.com').get('/status').reply(200)
    nock('http://node3.com').get('/status').reply(500)

    const result = await getNStorageNodes(sampleNodes)
    assert.deepEqual(result, ['http://node1.com', 'http://node2.com'])
  })

  it('should return nodes sorted by rendezvous score when a rendezvousKey is provided', async () => {
    nock('http://node1.com').get('/status').reply(200)
    nock('http://node2.com').get('/status').reply(200)
    nock('http://node3.com').get('/status').reply(200)

    const result = await getNStorageNodes(sampleNodes, 3, 'test-rendezvous-key')
    assert.deepEqual(result, [
      'http://node2.com',
      'http://node1.com',
      'http://node3.com'
    ])
  })

  it('should return only the healthy nodes sorted by rendezvous score when a rendezvousKey is provided', async () => {
    nock('http://node1.com').get('/status').reply(200)
    nock('http://node2.com').get('/status').reply(200)
    nock('http://node3.com').get('/status').reply(500)

    const result = await getNStorageNodes(sampleNodes, 3, 'test-rendezvous-key')
    assert.deepEqual(result, ['http://node2.com', 'http://node1.com'])
  })

  it('should return an empty array when there are no healthy nodes and numNodes is specified', async () => {
    nock('http://node1.com').get('/status').reply(500)
    nock('http://node2.com').get('/status').reply(500)
    nock('http://node3.com').get('/status').reply(500)

    const result = await getNStorageNodes(sampleNodes, 2)
    assert.deepEqual(result, [])
  })
})
