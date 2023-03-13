import { Navigate, useParams } from 'react-router-dom'

import { useNodeStatuses } from '../api'

export default function Search() {
  const { query } = useParams()
  const { isLoading, error, data: nodeStatuses } = useNodeStatuses()
  if (isLoading) return <>Loading...</>
  if (error) return <>An error has occurred: ${JSON.stringify(error)}</>
  if (!nodeStatuses) return <>Unable to query any nodes in network</>

  const shardLength = nodeStatuses[Object.keys(nodeStatuses)[0]].shards[0].length || 1

  function parseSearch(query: string) {
    let shard = ''
    let queryParam = ''
    if (query.length < 25) {
      // A job ID is 25 characters long, and a file appends to a job ID, so only a shard name can be shorter
      shard = query
    } else if (query.length === 25) {
      // Query is a job ID (25-character base36 string)
      shard = query.substring(25 - shardLength)
      queryParam = `?jobID=${query}`
    } else {
      // Either a file name or a fully namespaced file key is greather than 25 characters
      const queryWithoutFileExt = query.substring(0, query.lastIndexOf('_'))
      shard = queryWithoutFileExt.substring(queryWithoutFileExt.length - shardLength)

      const slashIdx = query.indexOf('/')
      if (slashIdx === -1) {
        // Query is a file name
        queryParam = `?fileName=${query}`
      } else {
        // Query is a fully namespaced file key
        queryParam = `?fileName=${query.substring(slashIdx + 1)}`
      }
    }
    return `/shard/${shard}${queryParam}`
  }

  return <Navigate replace to={query ? parseSearch(query) : '/'} />
}
