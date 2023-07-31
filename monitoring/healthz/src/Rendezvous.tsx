import { useState, useEffect } from 'react'
import { RendezvousHash } from '@audius/sdk'

const inputStyle = {
  fontSize: 18,
  padding: 10,
}

const textAreaStyle = {
  fontSize: 18,
  padding: 10,
  width: '1000px',
  height: '600px',
}

export function Rendezvous() {
  const [nodes, setNodes] = useState(['https://creatornode.audius.co', 'https://creatornode2.audius.co', 'https://creatornode3.audius.co', 'https://content-node.audius.co', 'https://audius-content-1.figment.io', 'https://creatornode.audius.prod-us-west-2.staked.cloud', 'https://audius-content-2.figment.io', 'https://audius-content-3.figment.io', 'https://audius-content-4.figment.io', 'https://audius-content-5.figment.io', 'https://creatornode.audius1.prod-us-west-2.staked.cloud', 'https://creatornode.audius2.prod-us-west-2.staked.cloud', 'https://creatornode.audius3.prod-us-west-2.staked.cloud', 'https://audius-content-6.figment.io', 'https://audius-content-7.figment.io', 'https://audius-content-8.figment.io', 'https://usermetadata.audius.co', 'https://audius-content-9.figment.io', 'https://audius-content-10.figment.io', 'https://audius-content-11.figment.io', 'https://audius.prod.capturealpha.io', 'https://content.grassfed.network', 'https://blockdaemon-audius-content-01.bdnodes.net', 'https://audius-content-1.cultur3stake.com', 'https://audius-content-2.cultur3stake.com', 'https://audius-content-3.cultur3stake.com', 'https://audius-content-4.cultur3stake.com', 'https://audius-content-5.cultur3stake.com', 'https://audius-content-6.cultur3stake.com', 'https://audius-content-7.cultur3stake.com', 'https://blockdaemon-audius-content-02.bdnodes.net', 'https://blockdaemon-audius-content-03.bdnodes.net', 'https://blockdaemon-audius-content-04.bdnodes.net', 'https://blockdaemon-audius-content-05.bdnodes.net', 'https://blockdaemon-audius-content-06.bdnodes.net', 'https://blockdaemon-audius-content-07.bdnodes.net', 'https://blockdaemon-audius-content-08.bdnodes.net', 'https://blockdaemon-audius-content-09.bdnodes.net', 'https://audius-content-8.cultur3stake.com', 'https://blockchange-audius-content-01.bdnodes.net', 'https://blockchange-audius-content-02.bdnodes.net', 'https://blockchange-audius-content-03.bdnodes.net', 'https://audius-content-9.cultur3stake.com', 'https://audius-content-10.cultur3stake.com', 'https://audius-content-11.cultur3stake.com', 'https://audius-content-12.cultur3stake.com', 'https://audius-content-13.cultur3stake.com', 'https://audius-content-14.cultur3stake.com', 'https://audius-content-15.cultur3stake.com', 'https://audius-content-16.cultur3stake.com', 'https://audius-content-17.cultur3stake.com', 'https://audius-content-18.cultur3stake.com', 'https://audius-content-12.figment.io', 'https://cn0.mainnet.audiusindex.org', 'https://cn1.mainnet.audiusindex.org', 'https://cn2.mainnet.audiusindex.org', 'https://cn3.mainnet.audiusindex.org', 'https://audius-content-13.figment.io', 'https://audius-content-14.figment.io', 'https://cn4.mainnet.audiusindex.org', 'https://audius-content-1.jollyworld.xyz', 'https://audius-creator-1.theblueprint.xyz', 'https://audius-creator-2.theblueprint.xyz', 'https://audius-creator-3.theblueprint.xyz', 'https://audius-creator-4.theblueprint.xyz', 'https://audius-creator-5.theblueprint.xyz', 'https://audius-creator-6.theblueprint.xyz', 'https://creatornode.audius8.prod-eks-ap-northeast-1.staked.cloud'])
  const [key, setKey] = useState('QmNnuRwRWxrbWwE9ib9dvWVr4hLgcHGAJ8euys8WH5NgCX')
  const [numNodes, setNumNodes] = useState(3)
  const [topN, setTopN] = useState([] as string[])
  const [top, setTop] = useState('')
  const [isLowercase, setIsLowercase] = useState(true)

  useEffect(() => {
    const hash = new RendezvousHash(...nodes)
    setTopN(hash.getN(numNodes, key))
    setTop(hash.get(key))
  }, [nodes, key, numNodes])

  function updateNodes(val: string) {
    setNodes(isLowercase ? val.toLowerCase().split(',') : val.split(','))
  }

  function updateKey(val: string) {
    setKey(val)
  }

  function updateNumNodes(val: string) {
    setNumNodes(parseInt(val))
  }

  return (
    <div style={{ margin: 50 }}>
      <div>
        <h4>
          <div>
            <label>
              <input
                type="checkbox"
                checked={isLowercase}
                onChange={() => setIsLowercase(!isLowercase)}
              />
              Auto-lowercase nodes (all prod code uses only lowercase for nodes, while CIDs (keys) are case-sensitive)
            </label>
          </div>
        </h4>
      </div>
      <div>
        <h3>Nodes ({nodes.length} values)</h3>
        <textarea
          style={textAreaStyle}
          value={nodes.join(',')}
          onChange={(e) => updateNodes(e.target.value)}
        />
      </div>
      <div>
        <h3>Key (CID)</h3>
        <input
          style={{ ...inputStyle, width: '600px' }}
          type="text"
          value={key}
          onChange={(e) => updateKey(e.target.value)}
        />
      </div>
      <div>
        <h3>Top N</h3>
        <input
          style={{ ...inputStyle, width: '75px' }}
          type="number"
          value={numNodes}
          onChange={(e) => updateNumNodes(e.target.value)}
        />
      </div>
      <div>
        <h3>Top N Result: {topN.join(',')}</h3>
        <h3>Top Result: {top}</h3>
      </div>
    </div>
  )
}