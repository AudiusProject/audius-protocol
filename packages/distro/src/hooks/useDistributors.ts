import devDistributors from '../distributors/dev.json'
import stageDistributors from '../distributors/stage.json'
import prodDistributors from '../distributors/prod.json'
import { useMemo } from 'react'

const env = import.meta.env.VITE_ENVIRONMENT as 'dev' | 'stage' | 'prod'

export const useDistributors = () => {
  const distributors = useMemo(() => {
    switch (env) {
      case 'dev':
        return devDistributors.distributors
      case 'stage':
        return stageDistributors.distributors
      case 'prod':
        return prodDistributors.distributors
    }
  }, [])
  return distributors
}
