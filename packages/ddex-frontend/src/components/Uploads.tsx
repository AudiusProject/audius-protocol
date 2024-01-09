import { useState } from 'react'
import useUploads from 'providers/useUploads'

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
    <>
      <h1>Uploads</h1>
      <div>
        <button onClick={() => setStatusFilter('success')}>Success</button>
        <button onClick={() => setStatusFilter('pending')}>Pending</button>
        <button onClick={() => setStatusFilter('error')}>Error</button>
      </div>
      <div>
        <button onClick={handlePrev} disabled={!prevId}>
          Previous
        </button>
        <button onClick={handleNext} disabled={!data || data.length === 0}>
          Next
        </button>
      </div>
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
    </>
  )
}

export default Uploads
