import { ChangeEvent, FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SHARD_LENGTH = 2

export default function Search() {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    let shard = ''
    let queryParam = ''
    if (search.length < 25) {
      // A job ID is 25 characters long, and a file appends to a job ID, so only a shard name can be shorter
      shard = search
    } else if (search.length === 25) {
      // Search is a job ID (25-character base36 string)
      shard = search.substring(25 - SHARD_LENGTH)
      queryParam = `?jobID=${search}`
    } else {
      // Either a file name or a fully namespaced file key is greather than 25 characters
      const searchWithoutFileExt = search.substring(0, search.lastIndexOf('_'))
      shard = searchWithoutFileExt.substring(searchWithoutFileExt.length - SHARD_LENGTH)

      const slashIdx = search.indexOf('/')
      if (slashIdx === -1) {
        // Search is a file name
        queryParam = `?fileName=${search}`
      } else {
        // Search is a fully namespaced file key
        queryParam = `?fileName=${search.substring(slashIdx + 1)}`
      }
    }
    navigate(`/shard/${shard}${queryParam}`)
  }

  return (
    <div className="m-auto max-w-md">
      <div className="mt-1">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="audius-search"
            id="audius-search"
            className="block w-full rounded-full border-gray-300 px-4 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="File name, S3 key, shard, or job ID"
            value={search}
            onChange={handleChange}
          />
        </form>
      </div>
    </div>
  )
}
