import { useSearchParams } from 'react-router-dom'

const isStageParam = 'isStaging'
const nodeTypeParam = 'nodeType'

export function useEnvironmentSelection(): [
  'staging' | 'prod',
  'content' | 'discovery' | 'core'
] {
  let [searchParams] = useSearchParams()

  const isStage = !!searchParams.get(isStageParam)
  const nodeType = searchParams.get(nodeTypeParam) || 'discovery'

  return [
    isStage ? 'staging' : 'prod',
    nodeType,
  ]
}

export function EnvironmentSelector() {
  let [searchParams, setSearchParams] = useSearchParams()

  const isStage = !!searchParams.get(isStageParam)
  const nodeType = searchParams.get(nodeTypeParam) || 'discovery'

  function toggleParam(name: string, value: '0' | '1') {
    setSearchParams((p) => {
      if (value == '0') p.delete(name)
      else p.set(name, value)
      return p
    })
  }

  function setNodeParam(value: 'content' | 'discovery' | 'core') {
    setSearchParams((p) => {
      if (value == 'discovery') p.delete(nodeTypeParam)
      else p.set(nodeTypeParam, value)
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
          className={`px-4 py-2 ${nodeType == 'discovery' ? 'bg-purple-300 text-white' : 'bg-gray-200 text-black'}`}
          onClick={() => setNodeParam('discovery')}
        >
          Discovery
        </button>
        <button
          className={`px-4 py-2 ${nodeType == 'content' ? 'bg-purple-300 text-white' : 'bg-gray-200 text-black'}`}
          onClick={() => setNodeParam('content')}
        >
          Content
        </button>
        <button
          className={`px-4 py-2 ${nodeType == 'core' ? 'bg-purple-300 text-white' : 'bg-gray-200 text-black'}`}
          onClick={() => setNodeParam('core')}
        >
          Core
        </button>
      </div>
    </div>
  )
}
