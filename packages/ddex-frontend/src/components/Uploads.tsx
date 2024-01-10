import { useState } from 'react'
import useUploads from 'providers/useUploads'

const Uploads = () => {
  const [statusFilter, setStatusFilter] = useState('')
  const [nextId, setNextId] = useState<number | undefined>(undefined)
  const [prevId, setPrevId] = useState<number | undefined>(undefined)
  const { data, error, isPending } = useUploads(statusFilter, nextId, prevId)

  const handleNext = () => {
    if (data?.hasMoreNext) {
      setNextId(data.uploads[0].id)
      setPrevId(undefined)
    }
  }

  const handlePrev = () => {
    if (data?.hasMorePrev) {
      setPrevId(data.uploads[data.uploads.length - 1].id)
      setNextId(undefined)
    }
  }

  return (
    <>
      <h1>Uploads</h1>
      <div>
        <button
          type="button"
          className="inline-flex items-center gap-x-1.5 rounded-md bg-purple-500 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 mx-1"
          onClick={() =>
            setStatusFilter((curFilter) =>
              curFilter === 'success' ? '' : 'success'
            )
          }
        >
          Success
          {statusFilter === 'success' && <CheckCircleIcon aria-hidden="true" />}
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-x-1.5 rounded-md bg-purple-500 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 mx-1"
          onClick={() =>
            setStatusFilter((curFilter) =>
              curFilter === 'pending' ? '' : 'pending'
            )
          }
        >
          Pending
          {statusFilter === 'pending' && <CheckCircleIcon aria-hidden="true" />}
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-x-1.5 rounded-md bg-purple-500 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500"
          onClick={() =>
            setStatusFilter((curFilter) =>
              curFilter === 'error' ? '' : 'error'
            )
          }
        >
          Error
          {statusFilter === 'error' && <CheckCircleIcon aria-hidden="true" />}
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
            {data.uploads.map((upload) => (
              <tr key={upload.id}>
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

      <div>
        <button
          type="button"
          className="inline-flex items-center gap-x-1.5 rounded-md bg-purple-500 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 disabled:text-gray-400 disabled:cursor-not-allowed mx-1"
          onClick={handlePrev}
          disabled={!data?.hasMorePrev}
        >
          Previous
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-x-1.5 rounded-md bg-purple-500 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 disabled:text-gray-400 disabled:cursor-not-allowed float-right"
          onClick={handleNext}
          disabled={!data?.hasMoreNext}
        >
          Next
        </button>
      </div>
    </>
  )
}

const CheckCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="-mr-0.5 h-5 w-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
)

export default Uploads
