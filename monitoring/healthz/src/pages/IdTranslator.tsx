import { useState } from 'react'
import { decodeId, encodeId } from '../AudiusSurvivalKit'

export function IdTranslator() {
  const [id, setId] = useState('')
  const [enc, setEnc] = useState('')

  function updateId(val: string) {
    setId(val)
    setEnc(encodeId(val))
  }

  function updateEnc(val: string) {
    setEnc(val)
    setId(decodeId(val).toString())
  }

  return (
    <div className="m-12 text-gray-900 dark:text-gray-200">
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Integer</h3>
        <input
          className="border rounded-md px-3 py-2 w-lg text-lg focus:border-blue-400 focus:outline-none dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
          type="text"
          value={id}
          onChange={(e) => updateId(e.target.value)}
        />
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">Encoded</h3>
        <input
          className="border rounded-md px-3 py-2 w-lg text-lg focus:border-blue-400 focus:outline-none dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
          type="text"
          value={enc}
          onChange={(e) => updateEnc(e.target.value)}
        />
      </div>
    </div>
  )
}
