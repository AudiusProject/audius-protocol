import { useSearchParams } from 'react-router-dom'

const isStageParam = 'isStaging'
const isContentParam = 'isContent'

export function useEnvironmentSelection(): [
  'staging' | 'prod',
  'content' | 'discovery'
] {
  let [searchParams] = useSearchParams()

  const isStage = !!searchParams.get(isStageParam)
  const isContent = !!searchParams.get(isContentParam)

  return [
    isStage ? 'staging' : 'prod',
    isContent ? 'content' : 'discovery',
  ]
}

export function EnvironmentSelector() {
  let [searchParams, setSearchParams] = useSearchParams()

  const isStage = !!searchParams.get(isStageParam)
  const isContent = !!searchParams.get(isContentParam)

  function toggleParam(name: string, value: '0' | '1') {
    setSearchParams((p) => {
      if (value == '0') p.delete(name)
      else p.set(name, value)
      return p
    })
  }

  return (
    <div className="flex space-x-4">
      <div className="flex">
        <button
          className={`px-4 py-2 ${isStage ? 'bg-purple-300 text-white' : 'bg-gray-200 text-black'}`}
          onClick={() => toggleParam(isStageParam, '1')}
        >
          Stage
        </button>
        <button
          className={`px-4 py-2 ${isStage ? 'bg-gray-200 text-black' : 'bg-purple-300 text-white'}`}
          onClick={() => toggleParam(isStageParam, '0')}
        >
          Prod
        </button>
      </div>
      <div className="flex">
        <button
          className={`px-4 py-2 ${isContent ? 'bg-gray-200 text-black' : 'bg-purple-300 text-white'}`}
          onClick={() => toggleParam(isContentParam, '0')}
        >
          Discovery
        </button>
        <button
          className={`px-4 py-2 ${isContent ? 'bg-purple-300 text-white' : 'bg-gray-200 text-black'}`}
          onClick={() => toggleParam(isContentParam, '1')}
        >
          Content
        </button>
      </div>
    </div>
  )
}
