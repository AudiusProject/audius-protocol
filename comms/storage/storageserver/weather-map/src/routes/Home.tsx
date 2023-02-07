import { useSearchParams } from 'react-router-dom'

import { useNodesToShards } from '../api'
import Nodes from '../components/nodes/Nodes'

export default function Home() {
  const { isLoading, error, data: hostsAndShards } = useNodesToShards()
  const [searchParams] = useSearchParams()

  let demo = false
  for (const queryParam of searchParams.keys()) {
    if (queryParam === 'demo') demo = true
  }

  if (isLoading) return <>Loading...</>
  if (error) return <>An error has occurred: ${JSON.stringify(error)}</>
  if (!hostsAndShards) return <>Unable to query any nodes in network</>

  // Add to hostsAndShards for the dev environment since we only have 4 nodes
  if (demo) {
    hostsAndShards[`0x123456789_${0}`] = {
      host: `http://demo:1234`,
      shards: ['DEMO'],
    }
    for (let i = 1; i < 50; i++) {
      hostsAndShards[`0x123456789_${i}`] = {
        host: `http://fake:${8000 + i}`,
        shards: ['aa', 'bb', 'cc', 'dd'],
      }
    }
  }

  return <Nodes hostsAndShards={hostsAndShards} />
}
