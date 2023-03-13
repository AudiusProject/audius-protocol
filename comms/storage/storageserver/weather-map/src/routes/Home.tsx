import { useNavigate, useSearchParams } from 'react-router-dom'

import { useNodeStatuses } from '../api'
import Nodes from '../components/nodes/Nodes'

export default function Home() {
  const { isLoading, error, data: nodeStatuses } = useNodeStatuses()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  let demo = false
  for (const queryParam of searchParams.keys()) {
    if (queryParam === 'demo') demo = true
  }

  if (isLoading) return <>Loading...</>
  if (error) return <>An error has occurred: ${JSON.stringify(error)}</>
  if (!nodeStatuses) return <>Unable to query any nodes in network</>

  // Add to nodeStatuses for the dev environment since we only have 4 nodes
  if (demo) {
    nodeStatuses[`0x123456789_${0}`] = {
      host: `http://demo:1234`,
      lastOk: new Date().toISOString(),
      shards: ['DEMO'],
    }
    for (let i = 1; i < 50; i++) {
      nodeStatuses[`0x123456789_${i}`] = {
        host: `http://fake:${8000 + i}`,
        lastOk: new Date().toISOString(),
        shards: ['a', 'b', 'c', 'd'],
      }
    }
  }

  return (
    <>
      <Nodes nodeStatuses={nodeStatuses} />
      <div className="mt-10 flex items-center justify-center">
        <button
          type="button"
          className="rounded-full bg-purple-600 py-2.5 px-4 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
          onClick={() => navigate('/history')}
        >
          View history
        </button>
      </div>
    </>
  )
}
