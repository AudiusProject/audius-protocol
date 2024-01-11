import { useState } from 'react'
import useUploads from 'providers/useUploads'
import { Button, Box, Flex } from '@audius/harmony'

const Uploads = () => {
  const [statusFilter, setStatusFilter] = useState('')
  const [nextId, setNextId] = useState<number | undefined>(undefined)
  const [prevId, setPrevId] = useState<number | undefined>(undefined)
  const { data, error, isPending } = useUploads(statusFilter, nextId, prevId)

  const handleNext = () => {
    if (data && data.length) {
      setNextId(data[data.length - 1].id)
      setPrevId(undefined)
    }
  }

  const handlePrev = () => {
    if (data && data.length) {
      setPrevId(data[0].id)
      setNextId(undefined)
    }
  }

  return (
    <Box>
      <Flex direction="column" gap="s">
        <h1>Uploads</h1>
        <Flex alignItems="center" gap="m">
          <div>
            <input
              type="checkbox"
              id="successFilter"
              checked={statusFilter === 'success'}
              onChange={() =>
                setStatusFilter((curFilter) =>
                  curFilter === 'success' ? '' : 'success'
                )
              }
            />
            <label htmlFor="successFilter">Success</label>
          </div>
          <div>
            <input
              type="checkbox"
              id="pendingFilter"
              checked={statusFilter === 'pending'}
              onChange={() =>
                setStatusFilter((curFilter) =>
                  curFilter === 'pending' ? '' : 'pending'
                )
              }
            />
            <label htmlFor="pendingFilter">Pending</label>
          </div>
          <div>
            <input
              type="checkbox"
              id="errorFilter"
              checked={statusFilter === 'error'}
              onChange={() =>
                setStatusFilter((curFilter) =>
                  curFilter === 'error' ? '' : 'error'
                )
              }
            />
            <label htmlFor="errorFilter">Error</label>
          </div>
        </Flex>
        {isPending && <div>Loading...</div>}
        {error && <div>Error: {error.message}</div>}
        {data && (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>From Zip File</th>
                <th>Uploaded By</th>
                <th>Uploaded At</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((upload, index) => (
                <tr key={index}>
                  <td>{upload.id}</td>
                  <td>{upload.from_zip_file}</td>
                  <td>{upload.uploaded_by}</td>
                  <td>{upload.uploaded_at.toLocaleString()}</td>
                  <td>{upload.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <Flex justifyContent="space-between">
          <Button
            variant="tertiary"
            size="small"
            onClick={handlePrev}
            disabled={!prevId}
          >
            Previous
          </Button>
          <Button
            variant="tertiary"
            size="small"
            onClick={handleNext}
            disabled={!nextId && (!data || data.length === 0)}
          >
            Next
          </Button>
        </Flex>
      </Flex>
    </Box>
  )
}

export default Uploads
