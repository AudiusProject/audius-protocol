import { useSearchParams } from 'react-router-dom'

const isStageParam = 'isStaging'
const isContentParam = 'isContent'

export function useEnvironmentSelection(): [
  'staging' | 'prod',
  'content-node' | 'discovery-node'
] {
  let [searchParams] = useSearchParams()

  const isStage = !!searchParams.get(isStageParam)
  const isContent = !!searchParams.get(isContentParam)

  return [
    isStage ? 'staging' : 'prod',
    isContent ? 'content-node' : 'discovery-node',
  ]
}

export function EnvironmentSlector() {
  let [searchParams, setSearchParams] = useSearchParams()

  const isStage = !!searchParams.get(isStageParam)
  const isContent = !!searchParams.get(isContentParam)

  function toggleParam(name: string) {
    setSearchParams((p) => {
      p.get(name) ? p.delete(name) : p.set(name, '1')
      return p
    })
  }

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={isContent}
          onChange={() => toggleParam(isContentParam)}
        />
        content nodes
      </label>
      <label>
        <input
          type="checkbox"
          checked={isStage}
          onChange={() => toggleParam(isStageParam)}
        />
        staging
      </label>
    </div>
  )
}
