import DataLoader from 'dataloader'
import type { Knex } from 'knex'

export const DiscoveryDB = (dbConnection: Knex) => {
  const blockConfirmationDataLoader = new DataLoader(
    async (blockNumbers: readonly number[]) => {
      const res = await dbConnection
        .table('blocks')
        .select('number')
        .where('is_current', true)

      if (res.length !== 1) {
        throw new Error('Expected SINGLE row in blocks marked as current')
      }

      const latestBlockNumber = res[0].number
      // Sort block_passed results
      return blockNumbers.map((bn) => latestBlockNumber >= bn)
    }
  )
  return {
    getBlockConfirmation: async (blockNumber: number) =>
      await blockConfirmationDataLoader.load(blockNumber)
  }
}
