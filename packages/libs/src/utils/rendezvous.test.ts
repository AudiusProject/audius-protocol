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
    const top2Nodes = hash.getNcrc32(2, key)
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

    const gotNodes = hash.getNcrc32(2, 'foo')
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
      const gotNodes = hash.getNcrc32(testcase.count, testcase.key)
      assert.deepEqual(gotNodes, testcase.expectedNodes)
    }
  })
})

const nodeList =
  'https://creatornode.audius.prod-eks-ap-northeast-1.staked.cloud,https://creatornode.audius1.prod-eks-ap-northeast-1.staked.cloud,https://creatornode.audius2.prod-eks-ap-northeast-1.staked.cloud,https://creatornode.audius3.prod-eks-ap-northeast-1.staked.cloud,https://creatornode.audius8.prod-eks-ap-northeast-1.staked.cloud,https://creatornode.audius.co,https://creatornode2.audius.co,https://creatornode3.audius.co,https://usermetadata.audius.co,https://audius-content-1.cultur3stake.com,https://audius-content-10.cultur3stake.com,https://audius-content-11.cultur3stake.com,https://audius-content-12.cultur3stake.com,https://audius-content-13.cultur3stake.com,https://audius-content-14.cultur3stake.com,https://audius-content-15.cultur3stake.com,https://audius-content-16.cultur3stake.com,https://audius-content-17.cultur3stake.com,https://audius-content-18.cultur3stake.com,https://audius-content-2.cultur3stake.com,https://audius-content-3.cultur3stake.com,https://audius-content-4.cultur3stake.com,https://audius-content-5.cultur3stake.com,https://audius-content-6.cultur3stake.com,https://audius-content-7.cultur3stake.com,https://audius-content-8.cultur3stake.com,https://audius-content-9.cultur3stake.com,https://cn1.stuffisup.com,https://audius-cn1.tikilabs.com,https://audius.prod.capturealpha.io,https://audius-content-1.figment.io,https://audius-content-10.figment.io,https://audius-content-11.figment.io,https://audius-content-12.figment.io,https://audius-content-13.figment.io,https://audius-content-14.figment.io,https://audius-content-2.figment.io,https://audius-content-3.figment.io,https://audius-content-4.figment.io,https://audius-content-5.figment.io,https://audius-content-6.figment.io,https://audius-content-7.figment.io,https://audius-content-8.figment.io,https://audius-content-9.figment.io,https://blockchange-audius-content-01.bdnodes.net,https://blockchange-audius-content-02.bdnodes.net,https://blockchange-audius-content-03.bdnodes.net,https://blockdaemon-audius-content-01.bdnodes.net,https://blockdaemon-audius-content-02.bdnodes.net,https://blockdaemon-audius-content-03.bdnodes.net,https://blockdaemon-audius-content-04.bdnodes.net,https://blockdaemon-audius-content-05.bdnodes.net,https://blockdaemon-audius-content-06.bdnodes.net,https://blockdaemon-audius-content-07.bdnodes.net,https://blockdaemon-audius-content-08.bdnodes.net,https://blockdaemon-audius-content-09.bdnodes.net,https://content.grassfed.network,https://cn0.mainnet.audiusindex.org,https://cn1.mainnet.audiusindex.org,https://cn2.mainnet.audiusindex.org,https://cn3.mainnet.audiusindex.org,https://cn4.mainnet.audiusindex.org,https://audius-content-1.jollyworld.xyz,https://audius-creator-1.theblueprint.xyz,https://audius-creator-2.theblueprint.xyz,https://audius-creator-3.theblueprint.xyz,https://audius-creator-4.theblueprint.xyz,https://audius-creator-5.theblueprint.xyz,https://audius-creator-6.theblueprint.xyz'.split(
    ','
  )

describe('HashMigration', () => {
  const hasher = new RendezvousHash(...nodeList)
  const cid = 'baeaaaiqsedziwknj44jsl5fak6vcbszzjlnl7pqtw2ipnyg7rsh5a2xnql2p2'

  it('has sha256 ordering', () => {
    const ordered = hasher.rendezvous256(cid).slice(0, 6)
    const expected = [
      'https://blockdaemon-audius-content-09.bdnodes.net',
      'https://cn4.mainnet.audiusindex.org',
      'https://audius-content-4.figment.io',
      'https://cn0.mainnet.audiusindex.org',
      'https://creatornode.audius3.prod-eks-ap-northeast-1.staked.cloud',
      'https://blockdaemon-audius-content-07.bdnodes.net'
    ]
    assert.deepEqual(ordered, expected)
  })

  it('has r2+r2', () => {
    const ordered = hasher.getN(6, cid)
    assert.deepEqual(ordered, [
      // # crc32 (top2)
      'https://audius-content-15.cultur3stake.com',
      'https://audius-content-4.figment.io',
      // # sha256
      'https://blockdaemon-audius-content-09.bdnodes.net',
      'https://cn4.mainnet.audiusindex.org',
      'https://cn0.mainnet.audiusindex.org',
      'https://creatornode.audius3.prod-eks-ap-northeast-1.staked.cloud'
    ])
  })
})
