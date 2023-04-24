import { DiscoveryDB } from '../datasources/db'

export interface Context {
  dataSources: {
    db: ReturnType<typeof DiscoveryDB>
  }
}
