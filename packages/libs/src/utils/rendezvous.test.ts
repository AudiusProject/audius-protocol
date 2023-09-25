import assert from 'assert'

import { RendezvousHash } from './rendezvous'

describe('RendezvousHash', () => {
  it('should create a new RendezvousHash with the given nodes', () => {
    const nodes = ['node1', 'node2', 'node3']
    const hash = new RendezvousHash(...nodes)
    assert.deepEqual(hash.getNodes(), nodes)
  })

  it('should add additional nodes', () => {
    const nodes = ['node1', 'node2', 'node3']
    const hash = new RendezvousHash(...nodes)
    const newNodes = ['node4', 'node5']
    hash.add(...newNodes)
    assert.deepEqual(hash.getNodes(), nodes.concat(newNodes))
  })

  it('should return the highest scoring node for a given key', () => {
    const nodes = ['node1', 'node2', 'node3']
    const hash = new RendezvousHash(...nodes)
    const key = 'test-key'
    const highestNode = hash.get(key)
    assert(nodes.includes(highestNode))
  })

  it('should return top N highest scoring nodes for a given key', () => {
    const nodes = ['node1', 'node2', 'node3']
    const hash = new RendezvousHash(...nodes)
    const key = 'test-key'
    const top2Nodes = hash.getN(2, key)
    assert.equal(top2Nodes.length, 2)
    assert(nodes.includes(top2Nodes[0]!))
    assert(nodes.includes(top2Nodes[1]!))
  })
})

// Ensures the hash results match the results of the equivalent Go code.
// See https://github.com/tysonmote/rendezvous/blob/be0258dbbd3d0df637b328d951067124541e7b6a/rendezvous_test.go

describe('RendezvousHash - Golang test cases', () => {
  it('TestHashGet', () => {
    const hash = new RendezvousHash()

    const gotNode = hash.get('foo')
    assert.equal(gotNode, '')

    hash.add('a', 'b', 'c', 'd', 'e')

    const testcases = [
      { key: '', expectedNode: 'd' },
      { key: 'foo', expectedNode: 'e' },
      { key: 'bar', expectedNode: 'c' }
    ]

    for (const testcase of testcases) {
      const gotNode = hash.get(testcase.key)
      assert.equal(gotNode, testcase.expectedNode)
    }
  })

  it('Test_Hash_GetN', () => {
    const hash = new RendezvousHash()

    const gotNodes = hash.getN(2, 'foo')
    assert.deepEqual(gotNodes, [])

    hash.add('a', 'b', 'c', 'd', 'e')

    const testcases = [
      { count: 1, key: 'foo', expectedNodes: ['e'] },
      { count: 2, key: 'bar', expectedNodes: ['c', 'e'] },
      { count: 3, key: 'baz', expectedNodes: ['d', 'a', 'b'] },
      { count: 2, key: 'biz', expectedNodes: ['b', 'a'] },
      { count: 0, key: 'boz', expectedNodes: [] },
      { count: 100, key: 'floo', expectedNodes: ['d', 'a', 'b', 'c', 'e'] }
    ]

    for (const testcase of testcases) {
      const gotNodes = hash.getN(testcase.count, testcase.key)
      assert.deepEqual(gotNodes, testcase.expectedNodes)
    }
  })
})
