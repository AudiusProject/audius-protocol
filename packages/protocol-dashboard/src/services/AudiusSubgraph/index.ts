import { gql } from '@apollo/client'
import { useGraphQuery as useQuery } from 'store/api/hooks'

const HEALTH_CHECK = gql`
  query healthCheck($subgraphName: String!) {
    indexingStatusForCurrentVersion(subgraphName: $subgraphName) {
      synced
      health
      fatalError {
        message
        block {
          number
          hash
        }
        handler
      }
      chains {
        chainHeadBlock {
          number
        }
        latestBlock {
          number
        }
      }
    }
  }
`

type Health = 'healthy' | 'unhealthy' | 'failed'
interface HealthCheck {
  healthCheck: {
    indexingStatusForCurrentVersion: {
      chains: {
        chainHeadBlock: {
          number: String
        }
        latestBlock: {
          number: String
        }
      }[]
      fatalError?: {
        message: string
        block: {
          number: string
          hash: string
        }
        handler: string
      }
      health: Health
      synced: boolean
    }
  }
}

const { error: gqlError, data: gqlData } = useQuery<HealthCheck>(HEALTH_CHECK)
