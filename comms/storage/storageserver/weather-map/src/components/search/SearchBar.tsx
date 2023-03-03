import { ChangeEvent, FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  return (
    <div className="m-auto max-w-md">
      <div className="mt-1">
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault()
            navigate(`/search/${query}`)
          }}
        >
          <input
            type="text"
            name="audius-search"
            id="audius-search"
            className="block w-full rounded-full border-gray-300 px-4 text-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-900 dark:text-neutral-100 sm:text-sm"
            placeholder="File name, S3 key, shard, or job ID"
            value={query}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          />
        </form>
      </div>
    </div>
  )
}
