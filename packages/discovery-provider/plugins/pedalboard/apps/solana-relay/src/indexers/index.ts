import { logger } from '../logger'

import { run as runCrowdfundIndexer } from './crowdfund'

const delay = (ms: number) =>
  new Promise((resolve, _reject) => setTimeout(resolve, ms))

const runIndexer = async (name: string, indexer: Function) => {
  while (true) {
    try {
      await indexer()
    } catch (e) {
      logger.error(e, `Uncaught indexing error in indexer ${name}`)
    } finally {
      await delay(500)
    }
  }
}

export const runIndexers = async () => {
  await Promise.all([runIndexer('crowdfund', runCrowdfundIndexer)])
}
