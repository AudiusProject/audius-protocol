import { useParams } from 'react-router-dom'

import { trpc } from 'utils/trpc'

const ReleaseDoc = () => {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, error } = trpc.releases.getDoc.useQuery(
    { id: id ?? '' },
    {
      enabled: !!id
    }
  )

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    console.error(`Failed to fetch document for ID '${id}': ${error}`)
    return <div>Error loading document</div>
  }

  return (
    <>
      {data?.document ? (
        <pre
          style={{
            margin: 0,
            overflow: 'auto',
            maxHeight: '100vh'
          }}
        >
          <code>{JSON.stringify(data.document, null, 2)}</code>
        </pre>
      ) : (
        <div>No data available</div>
      )}
    </>
  )
}

export default ReleaseDoc
