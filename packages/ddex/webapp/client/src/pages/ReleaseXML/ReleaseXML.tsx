import { useParams } from 'react-router-dom'

import { trpc } from 'utils/trpc'

const ReleaseXML = () => {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, error } = trpc.releases.getXML.useQuery(
    { id: id ?? '' },
    {
      enabled: !!id
    }
  )

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    console.error(`Failed to fetch XML for ID '${id}': ${error}`)
    return <div>Error loading raw XML</div>
  }

  return (
    <>
      {data?.raw_xml ? (
        <pre
          style={{
            margin: 0,
            overflow: 'auto',
            maxHeight: '100vh'
          }}
        >
          <code>{data.raw_xml}</code>
        </pre>
      ) : (
        <div>No XML data available</div>
      )}
    </>
  )
}

export default ReleaseXML
